"use client";

import { useState } from "react";
import { Input } from "@/components/ui";
import { uploadVariantImage, listMediaLibrary, type MediaLibraryItem } from "@/app/(app)/pre-orders/actions";
import { ToastFeedback } from "@/components/Toast";

// Galeri gambar varian (multi-image). Nilai berupa array URL. Bisa tambah lewat
// tempel tautan, unggah berkas (bulk, dengan status per file), atau pilih dari
// pustaka gambar yang pernah diunggah Seller. Gambar pertama dipakai "Utama".

const MAX_MB = 5;
const MAX_CONCURRENT_UPLOADS = 3;

type QueueStatus = "uploading" | "done" | "error";
type QueueItem = { id: string; name: string; status: QueueStatus; error?: string; file: File };

export function VariantImagesInput({
  value,
  onChange,
  campaignId,
}: {
  value: string[];
  onChange: (images: string[]) => void;
  /** Pustaka gambar hanya tersedia setelah Batch PO memiliki id (mode edit Produk). */
  campaignId?: string;
}) {
  const [mode, setMode] = useState<"upload" | "link" | "library">("upload");
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [library, setLibrary] = useState<MediaLibraryItem[] | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySelected, setLibrarySelected] = useState<Set<string>>(new Set());

  const add = (url: string) => {
    const u = url.trim();
    if (u && !value.includes(u)) onChange([...value, u]);
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  async function uploadOne(item: QueueItem) {
    setQueue((q) => q.map((row) => (row.id === item.id ? { ...row, status: "uploading", error: undefined } : row)));
    try {
      const fd = new FormData();
      fd.set("file", item.file);
      if (campaignId) fd.set("campaignId", campaignId);
      const res = await uploadVariantImage(fd);
      if (res.url) {
        add(res.url);
        setQueue((q) => q.map((row) => (row.id === item.id ? { ...row, status: "done" } : row)));
      } else {
        setQueue((q) => q.map((row) => (row.id === item.id ? { ...row, status: "error", error: res.error ?? "Gagal mengunggah." } : row)));
      }
    } catch {
      setQueue((q) => q.map((row) => (row.id === item.id ? { ...row, status: "error", error: "Gagal mengunggah." } : row)));
    }
  }

  async function runQueue(items: QueueItem[]) {
    let cursor = 0;
    async function worker() {
      while (cursor < items.length) {
        const item = items[cursor];
        cursor += 1;
        await uploadOne(item);
      }
    }
    await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT_UPLOADS, items.length) }, worker));
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError(null);
    const oversized = files.filter((f) => f.size > MAX_MB * 1024 * 1024);
    const accepted = files.filter((f) => f.size <= MAX_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`${oversized.length} berkas dilewati — ukuran melebihi ${MAX_MB}MB.`);
    }
    const items: QueueItem[] = accepted.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      status: "uploading",
      file,
    }));
    if (items.length === 0) return;
    setQueue((q) => [...q, ...items]);
    void runQueue(items);
  }

  function retry(id: string) {
    const item = queue.find((row) => row.id === id);
    if (item) void uploadOne(item);
  }

  function dismiss(id: string) {
    setQueue((q) => q.filter((row) => row.id !== id));
  }

  async function openLibrary() {
    if (!campaignId) return;
    setMode("library");
    if (library !== null) return;
    setLibraryLoading(true);
    const res = await listMediaLibrary(campaignId);
    setLibrary(res.data);
    if (res.error) setError(res.error);
    setLibraryLoading(false);
  }

  function toggleLibrarySelect(url: string) {
    setLibrarySelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  function addSelectedFromLibrary() {
    onChange([...value, ...[...librarySelected].filter((url) => !value.includes(url))]);
    setLibrarySelected(new Set());
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-sand-700">Gambar varian</span>
        <div className="flex gap-1" aria-label="Metode penambahan gambar">
          {(["upload", "library", "link"] as const)
            .filter((m) => m !== "library" || !!campaignId)
            .map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setError(null);
                  if (m === "library") void openLibrary();
                  else setMode(m);
                }}
                aria-pressed={mode === m}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  mode === m
                    ? "bg-brand-600 text-white"
                    : "bg-sand-100 text-sand-600 hover:bg-sand-200"
                }`}
              >
                {m === "upload" ? "Unggah" : m === "library" ? "Pustaka" : "Tautan"}
              </button>
            ))}
        </div>
      </div>

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

      {mode === "link" && (
        <div className="flex gap-2">
          <Input
            value={link}
            aria-label="Tautan gambar varian"
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
      )}

      {mode === "upload" && (
        <>
          <Input
            type="file"
            multiple
            aria-label="Unggah gambar varian"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFiles}
            className="file:mr-3 file:rounded-md file:border-0 file:bg-sand-100 file:px-3 file:py-1 file:text-sm"
          />
          {queue.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-sand-200 bg-sand-50 p-2 text-xs">
              {queue.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-sand-700" title={item.name}>{item.name}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {item.status === "uploading" && <span className="text-sand-500">Mengunggah…</span>}
                    {item.status === "done" && <span className="font-medium text-emerald-600">Berhasil</span>}
                    {item.status === "error" && (
                      <>
                        <span className="font-medium text-rose-600">{item.error ?? "Gagal"}</span>
                        <button type="button" onClick={() => retry(item.id)} className="font-semibold text-brand-700 underline">
                          Coba lagi
                        </button>
                      </>
                    )}
                    {item.status !== "uploading" && (
                      <button type="button" onClick={() => dismiss(item.id)} aria-label="Tutup" className="text-sand-400 hover:text-sand-600">
                        ×
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {mode === "library" && (
        <div className="space-y-2 rounded-lg border border-sand-200 bg-sand-50 p-2">
          {libraryLoading ? (
            <p className="text-xs text-sand-500">Memuat pustaka…</p>
          ) : !library || library.length === 0 ? (
            <p className="text-xs text-sand-500">Belum ada gambar yang pernah diunggah.</p>
          ) : (
            <>
              <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
                {library.map((item) => {
                  const selected = librarySelected.has(item.url);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleLibrarySelect(item.url)}
                      className={`relative rounded ring-2 transition ${selected ? "ring-brand-600" : "ring-transparent hover:ring-sand-300"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt="" className="h-16 w-16 rounded object-cover" />
                      {selected && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-sand-500">{librarySelected.size} dipilih</span>
                <button
                  type="button"
                  disabled={librarySelected.size === 0}
                  onClick={addSelectedFromLibrary}
                  className="rounded-md bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tambahkan {librarySelected.size || ""} gambar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <ToastFeedback error={error} />
    </div>
  );
}
