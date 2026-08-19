"use client";

import { useState } from "react";

/** Tombol salin ke clipboard dengan feedback singkat "Tersalin!". */
export function CopyButton({
  text,
  label = "Salin",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard tidak tersedia (mis. konteks non-HTTPS) — abaikan diam-diam
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      className={`rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {copied ? "Tersalin!" : label}
    </button>
  );
}
