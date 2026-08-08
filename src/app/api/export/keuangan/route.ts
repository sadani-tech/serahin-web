import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  buildKeuanganRows,
  buildKeuanganSummary,
} from "@/lib/export/keuangan";
import { buildKeuanganPdf } from "@/lib/export/pdf";
import { describeFilters, parseFilters } from "@/lib/export/query";
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
  const rawFormat = sp.get("format");
  const isPdf = rawFormat === "pdf";

  let campaignName: string | null = null;
  if (filters.campaignId) {
    const c = await prisma.campaign.findUnique({
      where: { id: filters.campaignId },
      select: { namaProduk: true },
    });
    campaignName = c?.namaProduk ?? null;
  }

  const periode = periodeLabel(filters.dateFrom, filters.dateTo);

  if (isPdf) {
    const summary = await buildKeuanganSummary(filters);
    const buf = await buildKeuanganPdf({
      summary,
      judul: campaignName ? `Kampanye: ${campaignName}` : "Semua Kampanye",
      keterangan: describeFilters(filters, campaignName),
    });
    const filename = buildFilename(
      "Rekap-Pembayaran",
      [campaignName ?? "Semua", periode],
      "pdf",
    );
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const format = parseExportFormat(rawFormat);
  const rows = await buildKeuanganRows(filters);
  const buf = buildWorkbook([{ name: "Rekap Pembayaran", rows }], format);
  const filename = buildFilename(
    "Rekap-Pembayaran",
    [campaignName ?? "Semua", periode],
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
