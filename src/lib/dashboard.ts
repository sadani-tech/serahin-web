import { api } from "@/lib/api";
import type { CampaignStatus } from "@/lib/types";

export const ACTIVE_STATUSES: CampaignStatus[] = [
  "OPEN",
  "CLOSED",
  "PRODUKSI",
  "SIAP_KIRIM",
];

export type DashboardFilters = {
  status?: CampaignStatus;
  dateFrom?: string;
  dateTo?: string;
};

export type DashboardData = {
  totalCashflow: number;
  totalNilaiPesanan: number;
  jumlahKampanyeAktif: number;
  activeCampaigns: {
    id: string;
    namaProduk: string;
    status: CampaignStatus;
    kuotaTotal: number;
    terisi: number;
    persen: number;
  }[];
  perluPerhatian: {
    orderId: string;
    campaignId: string;
    namaPembeli: string;
    namaProduk: string;
    varian: string;
    sisa: number;
    deadline: string | null;
    hariTersisa: number | null;
    lewat: boolean;
  }[];
  staleCampaigns: {
    id: string;
    namaProduk: string;
    status: CampaignStatus;
    hariLalu: number;
    lastUpdate: string;
  }[];
};

/** Ringkasan dashboard admin (v1.1 Modul 6) via backend. */
export function getDashboardData(
  filters: DashboardFilters,
): Promise<DashboardData> {
  return api.get<DashboardData>("/dashboard", {
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
}

export function persenKuotaColor(persen: number): string {
  if (persen >= 100) return "bg-rose-500";
  if (persen >= 75) return "bg-amber-500";
  return "bg-slate-900";
}
