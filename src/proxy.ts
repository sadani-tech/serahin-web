import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");

async function isValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

// Next 16: konvensi "middleware" diganti "proxy" (fungsi boleh default/named).
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/login";

  // Portal (v1.1), formulir PO publik (v1.2) & halaman statis CMS (v1.6) publik.
  const isPublic =
    pathname === "/" ||
    isLoginPage ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/po/") ||
    pathname.startsWith("/halaman/") ||
    pathname.startsWith("/payment/return") ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname === "/terms" ||
    pathname === "/refund-policy" ||
    pathname === "/privacy" ||
    pathname === "/data-deletion" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml";

  const loggedIn = await isValid(req.cookies.get("token")?.value);

  if (!loggedIn && !isPublic) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (loggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|uploads).*)"],
};
