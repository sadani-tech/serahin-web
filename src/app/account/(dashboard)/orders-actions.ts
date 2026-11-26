"use server";

import { api } from "@/lib/api";
import type { Dashboard } from "./page";

const allowed = new Set(["ALL", "TO_PAY", "PROCESSING", "TO_SHIP", "SHIPPED", "COMPLETED", "CANCELLED"]);

export async function loadBuyerOrders(page: number, status: string) {
  if (!Number.isInteger(page) || page < 2 || !allowed.has(status)) throw new Error("Permintaan halaman tidak valid.");
  const data = await api.get<Dashboard>("/buyer/dashboard", { page, limit: 10, statusGroup: status === "ALL" ? undefined : status });
  return { orders: data.orders, pagination: data.pagination };
}
