import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { prisma } from "./prisma";
import { ROLE_HOME, type Role } from "./constants";

const COOKIE_NAME = "bk_session";
const SESSION_DAYS = 7;
/** Kalan süre bu eşiğin altına inerse oturum yenilenir (sliding window). */
const RENEW_IF_REMAINING_MS = 3 * 24 * 60 * 60 * 1000;
/**
 * Tarayıcı çerezi DB süresinden uzun tutulur; gerçek geçerlilik Session.expiresAt ile
 * denetlenir. Böylece RSC içinde cookies().set() çağrılmadan sliding renewal çalışır.
 */
const COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60;

export type SessionUser = {
  isAdmin: boolean;
  mustChangePassword: boolean;
  id: string;
  email: string;
  name: string;
  role: string;
  title: string | null;
};

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  };
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  const store = await cookies();
  store.set(COOKIE_NAME, token, sessionCookieOptions());
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  store.delete(COOKIE_NAME);
}

/**
 * Kullanıcının tüm cihazlardaki oturumlarını sonlandırır
 * (mevcut çerez dahil).
 */
export async function destroyAllSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

async function maybeRenewSession(sessionId: string, expiresAt: Date) {
  const remaining = expiresAt.getTime() - Date.now();
  if (remaining >= RENEW_IF_REMAINING_MS) return;

  const newExpires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.update({
    where: { id: sessionId },
    data: { expiresAt: newExpires },
  });
}

/** Oturumdaki kullanıcı ya da null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.deleteMany({ where: { token } });
    return null;
  }

  if (session.user.disabledAt) {
    await prisma.session.deleteMany({ where: { userId: session.userId } });
    return null;
  }

  // Sliding-window: aktif kullanımda DB süresini uzat (çerez maxAge ayrı).
  await maybeRenewSession(session.id, session.expiresAt);

  const { user } = session;
  return {
    isAdmin: user.isAdmin,
    mustChangePassword: user.mustChangePassword,
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    title: user.title,
  };
}

/** Giriş zorunlu; rol listesi verilirse rol de kontrol edilir. */
export async function requireUser(roles?: Role[], allowPasswordChange = false): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword && !allowPasswordChange) redirect("/hesap/sifre");
  if (roles && roles.length && !roles.includes(user.role as Role)) {
    redirect(ROLE_HOME[user.role] ?? "/login");
  }
  return user;
}

/** Oturumdaki öğrencinin profil kaydı (öğrenci rolü için). */
export async function requireStudentProfile() {
  const user = await requireUser(["STUDENT"]);
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: { class: true },
  });
  if (!student) {
    throw new Error(
      "Bu hesaba bağlı öğrenci kaydı bulunamadı. Lütfen okul yönetimiyle iletişime geçin."
    );
  }
  return { user, student };
}

/** Velinin görüntüleyebileceği öğrenciler (bir velinin birden çok çocuğu olabilir). */
export async function requireParentChildren() {
  const user = await requireUser(["PARENT"]);
  const links = await prisma.studentParent.findMany({
    where: { parentId: user.id },
    include: { student: { include: { class: true } } },
    orderBy: { student: { no: "asc" } },
  });
  return { user, children: links.map((l) => l.student) };
}

/**
 * Bir kullanıcının belirli bir öğrencinin verisine erişip erişemeyeceğini denetler.
 * Öğretmen (rehber öğretmen dahil) tüm öğrencileri görebilir; öğrenci yalnızca
 * kendini; veli yalnızca çocuğunu.
 */
export async function canAccessStudent(user: SessionUser, studentId: string) {
  if (user.role === "TEACHER") return true;

  if (user.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });
    return !!student && student.userId === user.id;
  }

  if (user.role === "PARENT") {
    const link = await prisma.studentParent.findUnique({
      where: { studentId_parentId: { studentId, parentId: user.id } },
      select: { id: true },
    });
    return !!link;
  }

  return false;
}

export async function assertCanAccessStudent(user: SessionUser, studentId: string) {
  const ok = await canAccessStudent(user, studentId);
  if (!ok) throw new Error("Bu öğrencinin verilerine erişim yetkiniz yok.");
}

export async function requireAdmin() {
  const user = await requireUser(["TEACHER"]);
  if (!user.isAdmin) redirect("/ogretmen");
  return user;
}

export async function currentSessionToken() {
  return (await cookies()).get(COOKIE_NAME)?.value;
}
