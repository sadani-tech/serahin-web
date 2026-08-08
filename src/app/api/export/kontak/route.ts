import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  buildKontakRows,
  type KontakExtraColumn,
} from "@/lib/export/kontak";
import { describeFilters, parseFilters } from "@/lib/export/query";
import {
  buildFilename,
  buildWorkbook,
  mimeFor,
  parseExportFormat,
  periodeLabel,
} from "@/lib/export/format";

export const runtime = "nodejs";

const VALID_EXTRAS: KontakExtraColumn[] = ["kampanye", "status", "tanggal"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const filters = parseFilters(sp);
  const format = parseExportFormat(sp.get("format"));

  const extras = (sp.get("cols") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is KontakExtraColumn =>
      VALID_EXTRAS.includes(s as KontakExtraColumn),
    );

  const rows = await buildKontakRows(filters, extras);

  let campaignName: string | null = null;
  if (filters.campaignId) {
    const c = await prisma.campaign.findUnique({
      where: { id: filters.campaignId },
      select: { namaProduk: true },
    });
    campaignName = c?.namaProduk ?? null;
  }

  // Audit ekspor kontak (v1.6 4.3) — data kontak bersifat privat.
  await prisma.exportAudit.create({
    data: {
      jenis: "kontak",
      format,
      jumlahBaris: rows.length,
      keterangan: describeFilters(filters, campaignName),
      createdById: session.user.id,
    },
  });

  const buf = buildWorkbook([{ name: "Kontak", rows }], format);
  const filename = buildFilename(
    "Kontak-Pembeli",
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
