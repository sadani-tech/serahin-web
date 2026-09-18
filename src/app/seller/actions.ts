"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PUBLIC_API_URL, TOKEN_COOKIE } from "@/lib/api";

export type SellerFormState = { error?: string; success?: string } | undefined;

async function message(res: Response) {
  const body = await res.json().catch(() => null) as { message?: string | string[] } | null;
  return Array.isArray(body?.message) ? body.message.join(", ") : body?.message ?? `HTTP ${res.status}`;
}

export async function applySellerAction(_state: SellerFormState, form: FormData): Promise<SellerFormState> {
  const res = await fetch(`${PUBLIC_API_URL}/sellers/applications`, {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
    body: JSON.stringify({
      businessName: String(form.get("businessName") ?? ""),
      contactEmail: String(form.get("contactEmail") ?? ""),
      contactPhone: String(form.get("contactPhone") ?? ""),
      description: String(form.get("description") ?? ""),
      logoUrl: String(form.get("logoUrl") ?? "") || undefined,
    }),
  });
  if (!res.ok) return { error: await message(res) };
  return { success: "Pengajuan diterima. Tim Serahin akan meninjau data bisnis Anda." };
}

export async function sellerLoginAction(_state: SellerFormState, form: FormData): Promise<SellerFormState> {
  const res = await fetch(`${PUBLIC_API_URL}/auth/seller/login`, {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
    body: JSON.stringify({ email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") }),
  });
  if (!res.ok) return { error: await message(res) };
  const data = await res.json() as { accessToken: string; maxAgeSeconds?: number };
  (await cookies()).set(TOKEN_COOKIE, data.accessToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: data.maxAgeSeconds ?? 86400 });
  redirect("/seller/dashboard");
}

export async function activateSellerAction(_state: SellerFormState, form: FormData): Promise<SellerFormState> {
  const res = await fetch(`${PUBLIC_API_URL}/auth/seller/activate`, {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
    body: JSON.stringify({ token: String(form.get("token") ?? ""), password: String(form.get("password") ?? ""), confirmPassword: String(form.get("confirmPassword") ?? "") }),
  });
  if (!res.ok) return { error: await message(res) };
  const data = await res.json() as { accessToken: string; maxAgeSeconds?: number };
  (await cookies()).set(TOKEN_COOKIE, data.accessToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: data.maxAgeSeconds ?? 86400 });
  redirect("/seller/dashboard");
}
