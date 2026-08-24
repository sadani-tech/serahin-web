"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

export function CopyPortalLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/portal/${token}`);
  }, [token]);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard bisa gagal (izin) — biarkan pengguna menyalin manual dari input.
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-sand-500">
        Link portal pembeli
      </p>
      <p className="text-xs text-sand-500">
        Bagikan link ini ke pembeli agar bisa cek status sendiri (read-only).
      </p>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 rounded-lg border border-sand-300 bg-sand-50 px-3 py-2 text-xs text-sand-700"
        />
        <Button type="button" variant="secondary" onClick={copy}>
          {copied ? "Tersalin ✓" : "Salin"}
        </Button>
      </div>
    </div>
  );
}
