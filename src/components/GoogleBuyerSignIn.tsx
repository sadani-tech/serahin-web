"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: { client_id: string; callback: (response: { credential?: string }) => void; use_fedcm_for_prompt?: boolean }): void;
          renderButton(element: HTMLElement, options: Record<string, string | number>): void;
        };
      };
    };
  }
}

export function GoogleBuyerSignIn({ callbackUrl = "/account" }: { callbackUrl?: string }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const target = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  // v2.3.9 FR-42.1: akun Google baru atau lama tanpa nomor HP/WhatsApp
  // ditahan di sini — pendingToken dari /api/auth/google, sesi belum ada.
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const toast = useToast();

  const handleCredential = useCallback(async (response: { credential?: string }) => {
    if (!response.credential) {
      toast.error("Google tidak mengirimkan credential login.");
      return;
    }
    setPending(true);
    try {
      const result = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential, callbackUrl }),
      });
      const data = await result.json().catch(() => ({})) as { message?: string; redirectTo?: string; requiresPhone?: boolean; pendingToken?: string };
      if (!result.ok) throw new Error(data.message ?? "Login Google gagal.");
      if (data.requiresPhone && data.pendingToken) {
        setPendingToken(data.pendingToken);
        setPending(false);
        return;
      }
      if (!data.redirectTo) throw new Error(data.message ?? "Login Google gagal.");
      window.location.assign(data.redirectTo);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login Google gagal.");
      setPending(false);
    }
  }, [callbackUrl, toast]);

  const submitPhone = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingToken) return;
    setPending(true);
    try {
      const result = await fetch("/api/auth/google/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, phone, callbackUrl }),
      });
      const data = await result.json().catch(() => ({})) as { message?: string; redirectTo?: string };
      if (!result.ok || !data.redirectTo) throw new Error(data.message ?? "Gagal menyimpan nomor HP.");
      window.location.assign(data.redirectTo);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan nomor HP.");
      setPending(false);
    }
  }, [pendingToken, phone, callbackUrl, toast]);

  useEffect(() => {
    if (!clientId || !ready || !target.current || !window.google) return;
    target.current.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      use_fedcm_for_prompt: true,
    });
    window.google.accounts.id.renderButton(target.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: "continue_with",
      logo_alignment: "left",
      width: Math.min(360, target.current.clientWidth || 360),
    });
  }, [clientId, handleCredential, ready]);

  if (!clientId) return null;

  if (pendingToken) {
    return (
      <form onSubmit={submitPhone} className="mt-5 space-y-3 rounded-xl border border-sand-200 bg-cream-soft p-4">
        <p className="text-sm font-bold text-sand-800">Satu langkah lagi</p>
        <p className="text-xs text-sand-600">
          Isi nomor HP/WhatsApp untuk menyelesaikan masuk dengan Google — dipakai untuk notifikasi pesanan.
        </p>
        <input
          type="tel"
          required
          autoFocus
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="081234567890"
          className="block min-h-11 w-full rounded-xl border border-sand-300 px-3 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white shadow-brand transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : "Lanjutkan"}
        </button>
      </form>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-sand-400">
        <span className="h-px flex-1 bg-sand-200" />atau<span className="h-px flex-1 bg-sand-200" />
      </div>
      <div className={pending ? "pointer-events-none opacity-60" : ""} aria-busy={pending}>
        <div ref={target} className="flex min-h-11 w-full justify-center" />
      </div>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setReady(true)} />
      <p className="text-center text-[11px] leading-4 text-sand-500">
        Dengan Google, Anda menyetujui Syarat & Ketentuan dan Kebijakan Privasi Serahin.
      </p>
    </div>
  );
}
