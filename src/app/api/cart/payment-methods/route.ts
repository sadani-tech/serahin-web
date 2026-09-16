import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";

export async function GET() {
  try {
    return NextResponse.json(await api.get("/buyer/cart/payment-methods"));
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Metode pembayaran gagal dimuat." }, { status });
  }
}
