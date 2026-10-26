import { NextRequest } from "next/server";
import { proxyDownload } from "@/lib/download-proxy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyDownload(req, `/keuangan/vendor/${id}/rekap.pdf`);
}
