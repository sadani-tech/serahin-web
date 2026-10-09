"use client";

import { useActionState, useState } from "react";
import { FormError, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { submitReview } from "./actions";

export function ReviewForm({ orderId }: { orderId: string }) {
  const action = submitReview.bind(null, orderId);
  const [state, formAction] = useActionState(action, undefined);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (state?.success) {
    return (
      <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
        Terima kasih! Ulasan kamu sudah terkirim dan akan tampil setelah ditinjau Seller.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && <FormError message={state.error} />}
      <div>
        <p className="mb-1 text-sm font-bold text-sand-700">Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} bintang`}
              className="text-2xl leading-none"
            >
              {(hover || rating) >= n ? "★" : "☆"}
            </button>
          ))}
        </div>
        <input type="hidden" name="rating" value={rating} />
      </div>
      <Textarea name="quote" rows={3} required minLength={5} maxLength={1000} placeholder="Ceritakan pengalaman belanjamu — produk, kualitas, layanan Seller…" />
      <label className="flex items-center gap-2 text-sm text-sand-600">
        <input type="checkbox" name="tampilkanNama" className="h-4 w-4" />
        Tampilkan nama saya pada ulasan publik (jika tidak dicentang, nama disamarkan)
      </label>
      <SubmitButton loadingText="Mengirim…">Kirim Ulasan</SubmitButton>
    </form>
  );
}
