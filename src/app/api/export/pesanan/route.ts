import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildPesananRows } from "@/lib/export/pesanan";
import { parseFilters } from "@/lib/export/query";
import {
  buildFilename,
  buildWorkbook,
  mimeFor,
  parseExportFormat,
  periodeLabel,
} from "@/lib/export/format";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const filters = parseFilters(sp);
  const format = parseExportFormat(sp.get("format"));

  const rows = await buildPesananRows(filters);

  let campaignName: string | null = null;
  if (filters.campaignId) {
    const c = await prisma.campaign.findUnique({
      where: { id: filters.campaignId },
      select: { namaProduk: true },
    });
    campaignName = c?.namaProduk ?? null;
  }

  const buf = buildWorkbook([{ name: "Pesanan", rows }], format);
  const filename = buildFilename(
    "Daftar-Pesanan",
    [campaignName ?? "Semua", periodeLabel(filters.dateFrom, filters.dateTo)],
    format,
  );

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": mimeFor(format),
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
