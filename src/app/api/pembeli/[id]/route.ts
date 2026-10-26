import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";

// Proxy untuk modal riwayat pembelian (v2.3.9 FR-42.3) — `PembeliHistoryModal`
// adalah client component sehingga tidak bisa memakai `api` (httpOnly cookie)
// langsung, perlu lewat Route Handler server-side seperti `api/cart`.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json(await api.get(`/pembeli/${id}`));
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Permintaan gagal." }, { status });
  }
}
