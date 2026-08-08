import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildTemplateModeA, buildTemplateModeB } from "@/lib/import/template";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const mode = req.nextUrl.searchParams.get("mode");
  const campaignId = req.nextUrl.searchParams.get("campaign");

  let buf: Buffer;
  let filename: string;

  if (mode === "A") {
    buf = buildTemplateModeA();
    filename = "template-import-kampanye-penuh.xlsx";
  } else if (mode === "B") {
    if (!campaignId) {
      return new NextResponse("campaign wajib untuk Mode B", { status: 400 });
    }
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { variants: { select: { namaVarian: true } } },
    });
    if (!campaign) return new NextResponse("Kampanye tidak ada", { status: 404 });
    buf = buildTemplateModeB(campaign.variants.map((v) => v.namaVarian));
    filename = `template-import-pesanan-${campaign.namaProduk.replace(/\s+/g, "-").toLowerCase()}.xlsx`;
  } else {
    return new NextResponse("mode tidak valid (A/B)", { status: 400 });
  }

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
