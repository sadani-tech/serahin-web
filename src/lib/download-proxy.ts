import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

/**
 * Proxy unduhan file dari backend NestJS agar token JWT (cookie httpOnly)
 * tetap di sisi server — browser cukup menavigasi ke route Next ini.
 */
export async function proxyDownload(
  req: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  const res = await api.download(`${backendPath}${req.nextUrl.search}`);
  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }
  const headers = new Headers();
  const ct = res.headers.get("content-type");
  const cd = res.headers.get("content-disposition");
  if (ct) headers.set("content-type", ct);
  if (cd) headers.set("content-disposition", cd);
  return new NextResponse(res.body, { status: 200, headers });
}
