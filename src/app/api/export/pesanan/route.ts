import { NextRequest } from "next/server";
import { proxyDownload } from "@/lib/download-proxy";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return proxyDownload(req, "/export/pesanan");
}
