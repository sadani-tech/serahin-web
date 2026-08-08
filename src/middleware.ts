import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Instance NextAuth khusus Edge (tanpa Prisma) untuk validasi sesi di middleware.
const { auth } = NextAuth(authConfig);

// Lindungi seluruh aplikasi kecuali halaman login & aset publik.
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/login";
  // Portal (v1.1), formulir PO publik (v1.2) & halaman statis CMS (v1.6)
  // bersifat publik — portal/PO via token, halaman statis via slug.
  const isPublic =
    isLoginPage ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/po/") ||
    pathname.startsWith("/halaman/");

  if (!isLoggedIn && !isPublic) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|uploads).*)"],
};
