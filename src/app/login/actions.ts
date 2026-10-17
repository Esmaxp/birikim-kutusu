"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroyAllSessions,
  destroySession,
  getCurrentUser,
  verifyPassword,
} from "@/lib/auth";
import { ROLE_HOME, ROLE_LABELS } from "@/lib/constants";
import { getClientIp } from "@/lib/client-ip";
import {
  LOGIN_LIMIT,
  LOGIN_IP_LIMIT,
  LOGIN_WINDOW_MS,
  rateLimiter,
} from "@/lib/rate-limit";

export type LoginState = { error?: string };

const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!email || !password || email.length > 254 || Buffer.byteLength(password) > 72) {
    return { error: "E-posta ve şifre zorunludur." };
  }

  const ip = getClientIp(await headers());
  const rl = await rateLimiter.check(
    `login:acct:${email}`,
    LOGIN_LIMIT,
    LOGIN_WINDOW_MS
  );
  const ipLimit = ip ? await rateLimiter.check(`login:ip:${ip}`, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS) : null;
  if (!rl.allowed || (ipLimit && !ipLimit.allowed)) {
    return {
      error: `Çok fazla deneme. Lütfen ${Math.max(rl.retryAfterSec, ipLimit?.retryAfterSec ?? 0)} saniye sonra tekrar deneyin.`,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const validPassword = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || user.disabledAt || !validPassword) {
    return { error: "E-posta veya şifre hatalı." };
  }

  if (role && user.role !== role) {
    return {
      error: `Bu hesap "${ROLE_LABELS[user.role] ?? user.role}" hesabıdır. Lütfen doğru giriş türünü seçin.`,
    };
  }

  await createSession(user.id);
  redirect(user.mustChangePassword ? "/hesap/sifre" : ROLE_HOME[user.role] ?? "/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

/** Tüm cihazlardan çıkış. */
export async function logoutAllDevicesAction() {
  const user = await getCurrentUser();
  if (user) {
    await destroyAllSessions(user.id);
  } else {
    await destroySession();
  }
  redirect("/login");
}
