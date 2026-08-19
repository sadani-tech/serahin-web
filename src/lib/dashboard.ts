import { api } from "@/lib/api";
import type { CampaignStatus } from "@/lib/types";

// Re-export agar importer lama (Server Component) tidak perlu berubah;
// definisi asli dipindah ke dashboard-ui.ts (aman diimpor client).
export { NEAR_DEADLINE_DAYS, STALE_TIMELINE_DAYS, persenKuotaColor } from "@/lib/dashboard-ui";

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
  campaignId?: string;
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
    campaignId: filters.campaignId,
  });
}
