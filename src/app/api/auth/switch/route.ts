import { NextRequest, NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/api";

function safeCallbackUrl(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/account";
  }
  return value;
}

/**
 * Satu browser memakai satu cookie sesi. Saat Admin/Seller ingin checkout
 * sebagai Buyer, hapus sesi operasional lalu arahkan ke login Buyer dengan
 * callback yang aman. Draft checkout tetap tersimpan di localStorage.
 */
export function GET(request: NextRequest) {
  const callbackUrl = safeCallbackUrl(request.nextUrl.searchParams.get("callbackUrl"));
  const mode = request.nextUrl.searchParams.get("mode") === "register" ? "register" : "login";
  const destination = new URL(`/account/${mode}`, request.url);
  destination.searchParams.set("callbackUrl", callbackUrl);
  if (mode === "login" && request.cookies.has(TOKEN_COOKIE)) destination.searchParams.set("switched", "1");

  const response = NextResponse.redirect(destination);
  response.cookies.set(TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
