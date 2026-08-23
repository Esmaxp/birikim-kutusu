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
import {
  LOGIN_LIMIT,
  LOGIN_WINDOW_MS,
  rateLimiter,
} from "@/lib/rate-limit";

export type LoginState = { error?: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip") || h.get("cf-connecting-ip") || "unknown";
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!email || !password) {
    return { error: "E-posta ve şifre zorunludur." };
  }

  const ip = await clientIp();
  const rl = await rateLimiter.check(
    `login:${ip}:${email}`,
    LOGIN_LIMIT,
    LOGIN_WINDOW_MS
  );
  if (!rl.allowed) {
    return {
      error: `Çok fazla deneme. Lütfen ${rl.retryAfterSec} saniye sonra tekrar deneyin.`,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "E-posta veya şifre hatalı." };
  }

  if (role && user.role !== role) {
    return {
      error: `Bu hesap "${ROLE_LABELS[user.role] ?? user.role}" hesabıdır. Lütfen doğru giriş türünü seçin.`,
    };
  }

  await createSession(user.id);
  redirect(ROLE_HOME[user.role] ?? "/");
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
