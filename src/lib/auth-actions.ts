"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PUBLIC_API_URL, TOKEN_COOKIE } from "@/lib/api";

export type LoginState = { error?: string } | undefined;

function safeCallbackUrl(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/dashboard";
}

/** Login: minta JWT ke backend, simpan di cookie httpOnly, arahkan ke tujuan. */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl =
    String(formData.get("callbackUrl") ?? "/dashboard") || "/dashboard";

  const res = await fetch(`${PUBLIC_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!res.ok) {
    return { error: "Email atau kata sandi salah" };
  }

  const data = (await res.json()) as { accessToken: string; maxAgeSeconds?: number };
  const store = await cookies();
  store.set(TOKEN_COOKIE, data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: data.maxAgeSeconds ?? 60 * 60 * 24,
  });

  redirect(safeCallbackUrl(callbackUrl));
}

/** Logout: hapus cookie token. */
export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
  redirect("/");
}
