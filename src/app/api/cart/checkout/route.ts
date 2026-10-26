import { NextRequest, NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(await api.post("/buyer/cart/checkout", await request.json()));
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Checkout gagal." }, { status });
  }
}
