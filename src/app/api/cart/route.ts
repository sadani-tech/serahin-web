import { NextRequest, NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";

function failure(error: unknown) {
  const status = error instanceof ApiError ? error.status : 500;
  return NextResponse.json({ message: error instanceof Error ? error.message : "Permintaan gagal." }, { status });
}

export async function GET() {
  try { return NextResponse.json(await api.get("/buyer/cart")); }
  catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  try { return NextResponse.json(await api.post("/buyer/cart/sync", await request.json())); }
  catch (error) { return failure(error); }
}

export async function DELETE() {
  try { return NextResponse.json(await api.del("/buyer/cart")); }
  catch (error) { return failure(error); }
}
