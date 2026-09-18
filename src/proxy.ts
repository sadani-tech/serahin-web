import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");

async function sessionRole(token: string | undefined): Promise<"ADMIN" | "BUYER" | "SELLER" | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "BUYER" ? "BUYER" : payload.role === "SELLER" ? "SELLER" : "ADMIN";
  } catch {
    return null;
  }
}

// Next 16: konvensi "middleware" diganti "proxy" (fungsi boleh default/named).
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/login";
  const isBuyerAuthPage =
    pathname === "/account/login" ||
    pathname === "/account/register" ||
    pathname === "/account/activate" ||
    pathname === "/account/forgot-password" ||
    pathname === "/account/reset-password";

  // Portal (v1.1), formulir PO publik (v1.2) & halaman statis CMS (v1.6) publik.
  const isPublic =
    pathname === "/" ||
    isLoginPage ||
    isBuyerAuthPage ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/po/") ||
    pathname.startsWith("/halaman/") ||
    pathname.startsWith("/payment/return") ||
    pathname.startsWith("/s/") ||
    pathname.startsWith("/katalog/") ||
    pathname === "/katalog" ||
    pathname === "/catalog" ||
    pathname.startsWith("/catalog/") ||
    pathname === "/arsip" ||
    pathname === "/cart" ||
    pathname === "/seller" ||
    pathname === "/seller/login" ||
    pathname === "/seller/activate" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname === "/terms" ||
    pathname === "/refund-policy" ||
    pathname === "/privacy" ||
    pathname === "/data-deletion" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml";

  const role = await sessionRole(req.cookies.get("token")?.value);
  const loggedIn = role !== null;

  if (!loggedIn && !isPublic) {
    const url = new URL(pathname.startsWith("/account") ? "/account/login" : "/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (loggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(role === "BUYER" ? "/account" : role === "SELLER" ? "/seller/dashboard" : "/dashboard", req.nextUrl.origin));
  }
  if (role === "BUYER" && isBuyerAuthPage) {
    return NextResponse.redirect(new URL("/account", req.nextUrl.origin));
  }
  if (role === "BUYER" && !isPublic && !pathname.startsWith("/account")) return NextResponse.redirect(new URL("/account", req.nextUrl.origin));
  if (role === "SELLER" && pathname.startsWith("/account")) return NextResponse.redirect(new URL("/seller/dashboard", req.nextUrl.origin));
  if (role === "SELLER" && (pathname.startsWith("/data-privacy") || (pathname.startsWith("/konten") && !pathname.startsWith("/konten/faq")))) return NextResponse.redirect(new URL("/seller/dashboard", req.nextUrl.origin));
  if (role === "SELLER" && pathname.startsWith("/seller-applications")) return NextResponse.redirect(new URL("/seller/dashboard", req.nextUrl.origin));
  if (role === "ADMIN" && pathname.startsWith("/account") && !isBuyerAuthPage) return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  return NextResponse.next();
}

export const config = {
  // Jangan jalankan proxy untuk aset statis & file metadata (ikon, OG image,
  // manifest, robots/sitemap). Kalau ikut dicegat, request `/brand/*` dsb.
  // dari pengunjung anonim ke-redirect ke `/login` sehingga favicon dan
  // preview link sosial gagal dimuat.
  matcher: [
    "/((?!api/auth|api/cart|_next/static|_next/image|brand/|favicon.ico|icon.svg|icon.png|apple-icon.png|apple-touch-icon|opengraph-image|twitter-image|manifest.webmanifest|robots.txt|sitemap.xml|uploads).*)",
  ],
};
