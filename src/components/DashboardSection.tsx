"use client"

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, EmptyState, LinkButton } from "@/components/ui";
import { CampaignBadge } from "@/components/badges";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { persenKuotaColor, NEAR_DEADLINE_DAYS, STALE_TIMELINE_DAYS } from "@/lib/dashboard";
import type { CampaignStatus } from "@/lib/types";

export function DashboardSection<T extends { id: string }>({
  title,
  subtitle,
  items,
  emptyMessage,
  emptyDescription,
  action,
  render,
}: {
  title: string;
  subtitle: string;
  items: T[];
  emptyMessage: string;
  emptyDescription: string;
  action?: React.ReactNode;
  render: (item: T) => React.ReactNode;
}) {
  const [showEmpty, setShowEmpty] = useState(true);

  if (items.length > 0) {
    return (
      <Card>
        <CardHeader title={title} subtitle={subtitle} />
        <ul className="divide-y divide-slate-100">{items.map((item) => render(item))}</ul>
      </Card>
    );
  }

  if (!showEmpty) return null;

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <EmptyState title={emptyMessage} description={emptyDescription} action={action} />
      {action && (
        <div className="flex justify-center pt-2">
          <button onClick={() => setShowEmpty(false)} className="text-sm text-slate-500 hover:text-slate-700">
            Sembunyikan section
          </button>
        </div>
      )}
    </Card>
  );
}

export function ActiveCampaignsCard({
  items,
}: {
  items: {
    id: string;
    namaProduk: string;
    status: CampaignStatus;
    kuotaTotal: number;
    terisi: number;
    persen: number;
  }[];
}) {
  const [showEmpty, setShowEmpty] = useState(true);

  if (items.length === 0) {
    if (!showEmpty) return null;
    return (
      <Card>
        <CardHeader title="Kampanye aktif" subtitle="Progres kuota terisi per kampanye" />
        <EmptyState
          title="Belum ada kampanye aktif"
          description="Buat kampanye baru atau ubah filter."
          action={<LinkButton href="/kampanye/baru">+ Kampanye Baru</LinkButton>}
        />
        <div className="flex justify-center pt-2">
          <button onClick={() => setShowEmpty(false)} className="text-sm text-slate-500 hover:text-slate-700">
            Sembunyikan section
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Kampanye aktif" subtitle="Progres kuota terisi per kampanye" />
      <div className="divide-y divide-slate-100">
        {items.map((c) => (
          <Link key={c.id} href={`/kampanye/${c.id}`} className="block px-5 py-3 hover:bg-slate-50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">{c.namaProduk}</span>
                <CampaignBadge status={c.status} />
              </div>
              <span className="text-sm text-slate-600">
                {c.terisi} / {c.kuotaTotal} ({c.persen}%)
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${persenKuotaColor(c.persen)}`} style={{ width: `${Math.min(100, c.persen)}%` }} />
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
