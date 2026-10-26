import { NextRequest, NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";

export async function GET(request: NextRequest) {
  const amount = Number(request.nextUrl.searchParams.get("amount"));
  if (!Number.isSafeInteger(amount) || amount < 100) {
    return NextResponse.json({ message: "Nominal pembayaran tidak valid." }, { status: 400 });
  }
  try {
    const methods = await api.get<Array<{ code: string; name: string; fee?: number }>>(
      `/buyer/payment-methods?amount=${amount}`,
    );
    return NextResponse.json(methods, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof SyntaxError
      ? "Respons pilihan pembayaran tidak valid. Silakan coba lagi."
      : error instanceof Error
        ? error.message
        : "Metode pembayaran gagal dimuat.";
    return NextResponse.json(
      { message },
      { status },
    );
  }
}
