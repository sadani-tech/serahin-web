"use client";

import { useState } from "react";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_VERIFICATION_LABEL,
} from "@/lib/domain";

type CampaignOption = { id: string; namaProduk: string };

type CommonState = {
  campaigns: string[];
  from: string;
  to: string;
};

const EMPTY: CommonState = { campaigns: [], from: "", to: "" };

function buildUrl(base: string, params: Record<string, string>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

function CampaignDateFilters({
  state,
  setState,
  campaigns,
}: {
  state: CommonState;
  setState: (s: CommonState) => void;
  campaigns: CampaignOption[];
}) {
  const toggleCampaign = (id: string) => {
    const campaignsNext = state.campaigns.includes(id)
      ? state.campaigns.filter((campaignId) => campaignId !== id)
      : [...state.campaigns, id];
    setState({ ...state, campaigns: campaignsNext });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Batch PO (boleh pilih beberapa)">
        <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-sand-300 p-2">
          <p className="px-1 text-xs text-sand-500">Tanpa pilihan = semua Batch PO</p>
          {campaigns.map((campaign) => (
            <label key={campaign.id} className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-sand-50">
              <input type="checkbox" checked={state.campaigns.includes(campaign.id)} onChange={() => toggleCampaign(campaign.id)} />
              {campaign.namaProduk}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Dari tanggal">
        <Input
          type="date"
          value={state.from}
          onChange={(e) => setState({ ...state, from: e.target.value })}
        />
      </Field>
      <Field label="Sampai tanggal">
        <Input
          type="date"
          value={state.to}
          onChange={(e) => setState({ ...state, to: e.target.value })}
        />
      </Field>
    </div>
  );
}

export function ExportPanel({ campaigns }: { campaigns: CampaignOption[] }) {
  // --- Pesanan (4.1) ---
  const [pesanan, setPesanan] = useState<CommonState>(EMPTY);
  const [pesananStatus, setPesananStatus] = useState("");
  const [pesananFormat, setPesananFormat] = useState("xlsx");

  // --- Keuangan (4.2) ---
  const [keuangan, setKeuangan] = useState<CommonState>(EMPTY);
  const [keuanganVerif, setKeuanganVerif] = useState("");
  const [keuanganFormat, setKeuanganFormat] = useState("xlsx");

  // --- Kontak (4.3) ---
  const [kontak, setKontak] = useState<CommonState>(EMPTY);
  const [kontakCols, setKontakCols] = useState<string[]>([]);
  const [kontakFormat, setKontakFormat] = useState("xlsx");

  const toggleCol = (col: string) =>
    setKontakCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );

  const download = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className="space-y-6">
      {/* 4.1 Pesanan */}
      <Card className="space-y-4 p-5">
        <div>
          <h2 className="text-base font-semibold text-sand-900">
            Ekspor Pesanan
          </h2>
          <p className="text-sm text-sand-500">
            Daftar pesanan lengkap dengan rincian item keranjang, status, total,
            dan sisa tagihan.
          </p>
        </div>
        <CampaignDateFilters
          state={pesanan}
          setState={setPesanan}
          campaigns={campaigns}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status pesanan">
            <Select
              value={pesananStatus}
              onChange={(e) => setPesananStatus(e.target.value)}
            >
              <option value="">Semua status</option>
              {Object.entries(ORDER_STATUS_LABEL).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Format">
            <Select
              value={pesananFormat}
              onChange={(e) => setPesananFormat(e.target.value)}
            >
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={() =>
                download(
                  buildUrl("/api/export/pesanan", {
                    campaign: pesanan.campaigns.join(","),
                    from: pesanan.from,
                    to: pesanan.to,
                    status: pesananStatus,
                    format: pesananFormat,
                  }),
                )
              }
            >
              Unduh Pesanan
            </Button>
          </div>
        </div>
      </Card>

      {/* 4.2 Keuangan */}
      <Card className="space-y-4 p-5">
        <div>
          <h2 className="text-base font-semibold text-sand-900">
            Rekap Pembayaran
          </h2>
          <p className="text-sm text-sand-500">
            Excel/CSV untuk rincian per-transaksi, atau PDF untuk ringkasan
            visual.
          </p>
        </div>
        <CampaignDateFilters
          state={keuangan}
          setState={setKeuangan}
          campaigns={campaigns}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status verifikasi">
            <Select
              value={keuanganVerif}
              onChange={(e) => setKeuanganVerif(e.target.value)}
            >
              <option value="">Semua</option>
              {Object.entries(PAYMENT_VERIFICATION_LABEL).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Format">
            <Select
              value={keuanganFormat}
              onChange={(e) => setKeuanganFormat(e.target.value)}
            >
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="pdf">PDF (ringkasan)</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={() =>
                download(
                  buildUrl("/api/export/keuangan", {
                    campaign: keuangan.campaigns.join(","),
                    from: keuangan.from,
                    to: keuangan.to,
                    verifikasi: keuanganVerif,
                    format: keuanganFormat,
                  }),
                )
              }
            >
              Unduh Rekap
            </Button>
          </div>
        </div>
      </Card>

      {/* 4.3 Kontak */}
      <Card className="space-y-4 p-5">
        <div>
          <h2 className="text-base font-semibold text-sand-900">
            Ekspor Kontak
          </h2>
          <p className="text-sm text-sand-500">
            Nama & kontak pembeli. Data ini bersifat privat — setiap ekspor
            dicatat (siapa, kapan, jumlah).
          </p>
        </div>
        <CampaignDateFilters
          state={kontak}
          setState={setKontak}
          campaigns={campaigns}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kolom tambahan (opsional)">
            <div className="flex flex-wrap gap-3 pt-1">
              {[
                ["kampanye", "Batch PO"],
                ["status", "Status"],
                ["tanggal", "Tanggal"],
              ].map(([val, label]) => (
                <label
                  key={val}
                  className="flex items-center gap-1.5 text-sm text-sand-700"
                >
                  <input
                    type="checkbox"
                    checked={kontakCols.includes(val)}
                    onChange={() => toggleCol(val)}
                    className="h-4 w-4 rounded border-sand-300"
                  />
                  {label}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Format">
            <Select
              value={kontakFormat}
              onChange={(e) => setKontakFormat(e.target.value)}
            >
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
            </Select>
          </Field>
        </div>
        <div>
          <Button
            type="button"
            onClick={() =>
              download(
                buildUrl("/api/export/kontak", {
                  campaign: kontak.campaigns.join(","),
                  from: kontak.from,
                  to: kontak.to,
                  cols: kontakCols.join(","),
                  format: kontakFormat,
                }),
              )
            }
          >
            Unduh Kontak
          </Button>
        </div>
      </Card>
    </div>
  );
}
