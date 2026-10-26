"use client";

import { useMemo, useState } from "react";
import { Icon, IconSprite } from "@/components/revamp/IconSprite";
import { SELLER_ASSISTANT_CATEGORIES, type AssistantCategory, type AssistantQA } from "@/lib/seller-assistant-content";

/**
 * Support Assistant Seller — widget bantuan mandiri, BUKAN AI dan BUKAN
 * diteruskan ke Admin internal. Murni menavigasi skenario statis dari
 * src/lib/seller-assistant-content.ts (kategori → pertanyaan → jawaban),
 * plus pencarian kata kunci sederhana di seluruh skenario. Tombol melayang
 * di pojok kanan bawah, muncul di seluruh halaman Seller Workspace (lihat
 * mount-nya di AppShell.tsx, hanya untuk dashboardRole === "SELLER").
 */

type View = { kind: "categories" } | { kind: "category"; category: AssistantCategory } | { kind: "answer"; category: AssistantCategory; item: AssistantQA };

export function SellerAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ kind: "categories" });
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const results: { category: AssistantCategory; item: AssistantQA }[] = [];
    for (const category of SELLER_ASSISTANT_CATEGORIES) {
      for (const item of category.qa) {
        if (item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)) {
          results.push({ category, item });
        }
      }
    }
    return results;
  }, [query]);

  function openWidget() {
    setOpen(true);
    setView({ kind: "categories" });
    setQuery("");
  }

  function closeWidget() {
    setOpen(false);
  }

  function goBack() {
    if (view.kind === "answer") setView({ kind: "category", category: view.category });
    else if (view.kind === "category") setView({ kind: "categories" });
  }

  return (
    <>
      <IconSprite />
      <button
        type="button"
        onClick={() => (open ? closeWidget() : openWidget())}
        aria-label={open ? "Tutup Support Assistant" : "Buka Support Assistant"}
        aria-expanded={open}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-700 hover:-translate-y-0.5 active:scale-95 lg:bottom-6 lg:right-6"
      >
        {open ? <Icon name="x" className="h-6 w-6" /> : <Icon name="quote" className="h-6 w-6" />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-sun-400 text-[9px] font-black text-sand-900 ring-2 ring-white">
            ?
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Support Assistant"
          className="fixed bottom-36 right-4 z-50 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-2xl lg:bottom-24 lg:right-6"
        >
          <div className="bg-serahin-ribbon h-1 w-full shrink-0" aria-hidden="true" />
          <div className="flex shrink-0 items-center gap-3 border-b border-sand-100 px-4 py-3">
            {view.kind !== "categories" ? (
              <button type="button" onClick={goBack} aria-label="Kembali" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sand-500 hover:bg-sand-100">
                <Icon name="chev-left" className="h-4 w-4" />
              </button>
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Icon name="quote" className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-sand-900">
                {view.kind === "categories" ? "Support Assistant" : view.kind === "category" ? view.category.label : view.category.label}
              </p>
              <p className="truncate text-[11px] text-sand-500">Jawaban otomatis dari skenario fitur Seller</p>
            </div>
            <button type="button" onClick={closeWidget} aria-label="Tutup" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sand-400 hover:bg-sand-100 hover:text-sand-600">
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>

          {view.kind === "categories" && (
            <div className="border-b border-sand-100 p-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sand-400">
                  <Icon name="search" className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari pertanyaan, mis. produk, DP…"
                  className="w-full rounded-xl border border-sand-300 py-2 pl-9 pr-3 text-sm text-sand-900 placeholder:text-sand-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {view.kind === "categories" && searchResults !== null && (
              <ul className="divide-y divide-sand-100">
                {searchResults.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-sand-500">Tidak ada jawaban yang cocok. Coba kata kunci lain.</li>
                ) : (
                  searchResults.map(({ category, item }) => (
                    <li key={`${category.id}-${item.q}`}>
                      <button
                        type="button"
                        onClick={() => setView({ kind: "answer", category, item })}
                        className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-sand-50"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">{category.label}</span>
                        <span className="text-sm font-semibold text-sand-800">{item.q}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}

            {view.kind === "categories" && searchResults === null && (
              <ul className="divide-y divide-sand-100">
                {SELLER_ASSISTANT_CATEGORIES.map((category) => (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => setView({ kind: "category", category })}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-sand-50"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                        <Icon name={category.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-bold text-sand-800">{category.label}</span>
                      <Icon name="chev-right" className="h-4 w-4 shrink-0 text-sand-300" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {view.kind === "category" && (
              <ul className="divide-y divide-sand-100">
                {view.category.qa.map((item) => (
                  <li key={item.q}>
                    <button
                      type="button"
                      onClick={() => setView({ kind: "answer", category: view.category, item })}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-sand-50"
                    >
                      <span className="min-w-0 flex-1 text-sm font-semibold text-sand-800">{item.q}</span>
                      <Icon name="chev-right" className="h-4 w-4 shrink-0 text-sand-300" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {view.kind === "answer" && (
              <div className="px-4 py-4">
                <p className="text-sm font-extrabold text-sand-900">{view.item.q}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-sand-700">{view.item.a}</p>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-sand-100 bg-sand-50 px-4 py-2.5 text-center text-[11px] text-sand-500">
            Jawaban otomatis berdasarkan fitur yang tersedia — bukan AI, bukan chat langsung ke Admin.
          </div>
        </div>
      )}
    </>
  );
}
