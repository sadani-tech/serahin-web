"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, PUBLIC_API_URL, TOKEN_COOKIE } from "@/lib/api";

export type BuyerActionState = { error?: string; message?: string } | undefined;

function safePath(value: string, fallback = "/account") {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : fallback;
}

async function body(res: Response) {
  const data = (await res.json().catch(() => ({}))) as { message?: string | string[]; accessToken?: string; callbackPath?: string; maxAgeSeconds?: number };
  const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
  return { data, message };
}

async function setSession(token: string, maxAgeSeconds = 60 * 60 * 24) {
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: maxAgeSeconds,
  });
}

export async function buyerLoginAction(_prev: BuyerActionState, form: FormData): Promise<BuyerActionState> {
  const callbackUrl = safePath(String(form.get("callbackUrl") ?? "/account"));
  const res = await fetch(`${PUBLIC_API_URL}/auth/buyer/login`, {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
    body: JSON.stringify({ email: form.get("email"), password: form.get("password"), rememberMe: form.get("rememberMe") === "on" }),
  });
  const { data, message } = await body(res);
  if (!res.ok || !data.accessToken) return { error: message ?? "Email atau kata sandi salah, atau akun belum aktif." };
  await setSession(data.accessToken, data.maxAgeSeconds);
  redirect(callbackUrl);
}

export async function buyerRegisterAction(_prev: BuyerActionState, form: FormData): Promise<BuyerActionState> {
  const callbackPath = safePath(String(form.get("callbackUrl") ?? "/account"));
  const res = await fetch(`${PUBLIC_API_URL}/auth/buyer/register`, {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
    body: JSON.stringify({ name: form.get("name"), email: form.get("email"), phone: form.get("phone"), password: form.get("password"), confirmPassword: form.get("confirmPassword"), callbackPath, acceptPolicies: form.get("acceptPolicies") === "on" }),
  });
  const { message } = await body(res);
  return res.ok ? { message: message ?? "Periksa email untuk aktivasi akun." } : { error: message ?? "Pendaftaran gagal." };
}

export async function activateBuyerAction(_prev: BuyerActionState, form: FormData): Promise<BuyerActionState> {
  const res = await fetch(`${PUBLIC_API_URL}/auth/buyer/activate`, {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
    body: JSON.stringify({ token: form.get("token") }),
  });
  const { data, message } = await body(res);
  if (!res.ok || !data.accessToken) return { error: message ?? "Tautan aktivasi tidak valid." };
  await setSession(data.accessToken, data.maxAgeSeconds);
  redirect(safePath(data.callbackPath ?? String(form.get("callbackUrl") ?? "/account")));
}

export async function forgotPasswordAction(_prev: BuyerActionState, form: FormData): Promise<BuyerActionState> {
  const res = await fetch(`${PUBLIC_API_URL}/auth/buyer/forgot-password`, {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
    body: JSON.stringify({ email: form.get("email") }),
  });
  const { message } = await body(res);
  return res.ok ? { message: message ?? "Jika email terdaftar, tautan reset akan dikirim." } : { error: message ?? "Permintaan gagal." };
}

export async function resetPasswordAction(_prev: BuyerActionState, form: FormData): Promise<BuyerActionState> {
  const res = await fetch(`${PUBLIC_API_URL}/auth/buyer/reset-password`, {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
    body: JSON.stringify({ token: form.get("token"), password: form.get("password"), confirmPassword: form.get("confirmPassword") }),
  });
  const { message } = await body(res);
  return res.ok ? { message: message ?? "Kata sandi berhasil diubah." } : { error: message ?? "Reset gagal." };
}

export async function updateBuyerProfileAction(_prev: BuyerActionState, form: FormData): Promise<BuyerActionState> {
  const callbackUrl = safePath(String(form.get("callbackUrl") ?? ""), "");
  try {
    await api.patch("/auth/buyer/profile", { name: form.get("name"), phone: form.get("phone") });
    revalidatePath("/account"); revalidatePath("/account/profile");
  } catch (error) { return { error: error instanceof Error ? error.message : "Profil gagal diperbarui." }; }
  if (callbackUrl) redirect(callbackUrl);
  return { message: "Profil berhasil diperbarui." };
}

/** Upload avatar profil Buyer (v2.3.7 FR-37.39/37.40). */
export async function uploadBuyerAvatarAction(_prev: BuyerActionState, form: FormData): Promise<BuyerActionState> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih file gambar terlebih dahulu." };
  const fd = new FormData();
  fd.set("file", file);
  try {
    await api.postForm("/auth/buyer/profile/avatar", fd);
    revalidatePath("/account"); revalidatePath("/account/profile");
  } catch (error) { return { error: error instanceof Error ? error.message : "Avatar gagal diunggah." }; }
  return { message: "Avatar berhasil diperbarui." };
}

export async function changeBuyerPasswordAction(_prev: BuyerActionState, form: FormData): Promise<BuyerActionState> {
  try {
    const result = await api.post<{ accessToken: string }>("/auth/buyer/change-password", { currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword"), confirmPassword: form.get("confirmPassword") });
    await setSession(result.accessToken);
    return { message: "Kata sandi berhasil diperbarui dan sesi lain telah dicabut." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Kata sandi gagal diperbarui." }; }
}
