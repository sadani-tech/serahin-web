"use client";

import { useState } from "react";

export function PortalLinkBox({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/portal/${token}`
      : `/portal/${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* biarkan pengguna salin manual */
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700"
        />
        <button
          type="button"
          onClick={copy}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          {copied ? "Tersalin ✓" : "Salin"}
        </button>
      </div>
      <a
        href={url}
        className="block rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-200"
      >
        Buka halaman status pesanan →
      </a>
    </div>
  );
}
