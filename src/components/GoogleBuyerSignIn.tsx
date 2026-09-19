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
      const data = await result.json().catch(() => ({})) as { message?: string; redirectTo?: string };
      if (!result.ok || !data.redirectTo) throw new Error(data.message ?? "Login Google gagal.");
      window.location.assign(data.redirectTo);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login Google gagal.");
      setPending(false);
    }
  }, [callbackUrl, toast]);

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
