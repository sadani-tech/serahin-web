"use client"

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, EmptyState, LinkButton, ScrollList } from "@/components/ui";
import { CampaignBadge } from "@/components/badges";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { persenKuotaColor, NEAR_DEADLINE_DAYS, STALE_TIMELINE_DAYS } from "@/lib/dashboard-ui";
import type { CampaignStatus } from "@/lib/types";

export function DashboardSection({
  title,
  subtitle,
  itemCount,
  emptyMessage,
  emptyDescription,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  itemCount: number;
  emptyMessage: string;
  emptyDescription: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [showEmpty, setShowEmpty] = useState(true);

  if (itemCount > 0) {
    return (
      <Card>
        <CardHeader title={title} subtitle={subtitle} />
        <ScrollList>
          <ul className="divide-y divide-sand-100">{children}</ul>
        </ScrollList>
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
          <button onClick={() => setShowEmpty(false)} className="text-sm text-sand-500 hover:text-sand-700">
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
        <CardHeader title="Batch PO aktif" subtitle="Progres kuota terisi per Batch PO" />
        <EmptyState
          title="Belum ada Batch PO aktif"
          description="Buat Batch PO baru atau ubah filter."
          action={<LinkButton href="/pre-orders/baru">+ Buat Batch PO</LinkButton>}
        />
        <div className="flex justify-center pt-2">
          <button onClick={() => setShowEmpty(false)} className="text-sm text-sand-500 hover:text-sand-700">
            Sembunyikan section
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Batch PO aktif" subtitle="Progres kuota terisi per Batch PO" />
      <ScrollList className="divide-y divide-sand-100">
        {items.map((c) => (
          <Link key={c.id} href={`/pre-orders/${c.id}`} className="block px-5 py-3 hover:bg-sand-50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sand-900">{c.namaProduk}</span>
                <CampaignBadge status={c.status} />
              </div>
              <span className="text-sm text-sand-600">
                {c.terisi} / {c.kuotaTotal} ({c.persen}%)
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sand-100">
              <div className={`h-full rounded-full ${persenKuotaColor(c.persen)}`} style={{ width: `${Math.min(100, c.persen)}%` }} />
            </div>
          </Link>
        ))}
      </ScrollList>
    </Card>
  );
}
