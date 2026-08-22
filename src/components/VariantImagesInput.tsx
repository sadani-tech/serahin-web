"use client";

import { useState } from "react";
import { Input } from "@/components/ui";
import { uploadVariantImage } from "@/app/(app)/kampanye/actions";

// Galeri gambar varian (multi-image). Nilai berupa array URL. Bisa tambah lewat
// tempel tautan atau unggah berkas; gambar pertama dipakai sebagai "Utama".

const MAX_MB = 5;

export function VariantImagesInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (images: string[]) => void;
}) {
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = (url: string) => {
    const u = url.trim();
    if (u && !value.includes(u)) onChange([...value, u]);
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

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
      if (res.url) add(res.url);
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
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Gambar ${i + 1}`}
                className="h-16 w-16 rounded object-cover ring-1 ring-sand-200"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Hapus gambar"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white shadow"
              >
                ×
              </button>
              {i === 0 && (
                <span className="absolute inset-x-0 bottom-0 rounded-b bg-sand-900/70 py-0.5 text-center text-[9px] font-medium text-white">
                  Utama
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1">
        {(["upload", "link"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              mode === m
                ? "bg-brand-600 text-white"
                : "bg-sand-100 text-sand-600 hover:bg-sand-200"
            }`}
          >
            {m === "upload" ? "Unggah" : "Tautan"}
          </button>
        ))}
      </div>

      {mode === "link" ? (
        <div className="flex gap-2">
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(link);
                setLink("");
              }
            }}
            placeholder="https://… lalu Enter / Tambah"
          />
          <button
            type="button"
            onClick={() => {
              add(link);
              setLink("");
            }}
            className="shrink-0 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700"
          >
            Tambah
          </button>
        </div>
      ) : (
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          disabled={uploading}
          className="file:mr-3 file:rounded-md file:border-0 file:bg-sand-100 file:px-3 file:py-1 file:text-sm"
        />
      )}

      {uploading && <p className="text-xs text-sand-500">Mengunggah…</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
