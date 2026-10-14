"use client";

import { useActionState, useRef, useState } from "react";
import { ToastFeedback } from "@/components/Toast";
import { uploadSellerLogoAction } from "./actions";

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

export function LogoForm({ businessName, logoUrl }: { businessName: string; logoUrl: string | null }) {
  const [state, action, pending] = useActionState(uploadSellerLogoAction, undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    setLocalError(null);
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      setLocalError("Format harus JPG, PNG, atau WEBP.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setLocalError("Ukuran file maksimal 2 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  const shown = preview ?? logoUrl;

  return (
    <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-sand-900">Logo toko</h2>
      <p className="mt-1 text-sm text-sand-500">Logo ini tampil di storefront publik dan panel Seller.</p>
      <ToastFeedback error={state?.error} success={state?.success} />
      {localError && <p className="mt-2 text-sm font-bold text-rose-600">{localError}</p>}
      <form action={action} className="mt-4 flex items-center gap-4">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo Seller bisa dari S3/CDN eksternal
          <img src={shown} alt={businessName} className="h-16 w-16 rounded-full object-cover ring-1 ring-sand-200" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-lg font-extrabold text-brand-700 ring-1 ring-sand-200">
            {initials(businessName)}
          </div>
        )}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="block w-full text-sm text-sand-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sand-100 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-sand-700 hover:file:bg-sand-200"
          />
          <p className="mt-1 text-xs text-sand-500">JPG, PNG, atau WEBP, maksimal 2 MB.</p>
          <button disabled={pending || !!localError} className="mt-2 min-h-11 rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
            {pending ? "Mengunggah…" : "Unggah logo"}
          </button>
        </div>
      </form>
    </section>
  );
}
