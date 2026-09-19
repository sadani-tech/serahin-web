import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_API_URL, TOKEN_COOKIE } from "@/lib/api";

function safeCallbackUrl(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/account";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { credential?: unknown; callbackUrl?: unknown } | null;
  if (typeof body?.credential !== "string") {
    return NextResponse.json({ message: "Credential Google tidak ditemukan." }, { status: 400 });
  }

  const upstream = await fetch(`${PUBLIC_API_URL}/auth/buyer/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ credential: body.credential, acceptPolicies: true }),
  });
  const result = await upstream.json().catch(() => ({})) as {
    accessToken?: string;
    maxAgeSeconds?: number;
    message?: string | string[];
  };
  if (!upstream.ok || !result.accessToken) {
    const message = Array.isArray(result.message) ? result.message.join(", ") : result.message;
    return NextResponse.json({ message: message ?? "Login Google gagal." }, { status: upstream.status || 401 });
  }

  const response = NextResponse.json({ redirectTo: safeCallbackUrl(body.callbackUrl) });
  response.cookies.set(TOKEN_COOKIE, result.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: result.maxAgeSeconds ?? 60 * 60 * 24 * 30,
  });
  return response;
}
