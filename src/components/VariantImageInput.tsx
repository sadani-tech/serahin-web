"use client";

import { useState } from "react";
import { Input } from "@/components/ui";
import { uploadVariantImage } from "@/app/(app)/kampanye/actions";

// Input gambar varian dengan dua mode: tempel tautan (URL) atau unggah berkas.
// Nilai yang disimpan tetap berupa URL string (gambarUrl) — hasil upload
// mengembalikan path `/uploads/…` dari backend.

const MAX_MB = 5;

export function VariantImageInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [mode, setMode] = useState<"link" | "upload">("link");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Ukuran gambar maksimal ${MAX_MB}MB.`);
      e.target.value = "";
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadVariantImage(fd);
      if (res.url) onChange(res.url);
      else setError(res.error ?? "Gagal mengunggah gambar.");
    } catch {
      setError("Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {(["link", "upload"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              mode === m
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {m === "link" ? "Tautan" : "Unggah"}
          </button>
        ))}
      </div>

      {mode === "link" ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… (link Google Drive/CDN)"
        />
      ) : (
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          disabled={uploading}
          className="file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm"
        />
      )}

      {uploading && <p className="text-xs text-slate-500">Mengunggah…</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      {value ? (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Pratinjau gambar varian"
            className="h-14 w-14 rounded object-cover ring-1 ring-slate-200"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-rose-600 hover:text-rose-700"
          >
            Hapus gambar
          </button>
        </div>
      ) : null}
    </div>
  );
}
