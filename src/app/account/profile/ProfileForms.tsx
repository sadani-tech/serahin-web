"use client";
import { useActionState, useRef, useState } from "react";
import { changeBuyerPasswordAction, updateBuyerProfileAction, uploadBuyerAvatarAction } from "@/lib/buyer-auth-actions";
import { ToastFeedback } from "@/components/Toast";
import Link from "next/link";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

function Notice({ state }: { state: { error?: string; message?: string } | undefined }) {
  return <ToastFeedback error={state?.error} success={state?.message} />;
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Upload avatar profil Buyer dengan preview lokal sebelum submit (v2.3.7 FR-37.40). */
function AvatarForm({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const [state, action, pending] = useActionState(uploadBuyerAvatarAction, undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    setLocalError(null);
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      setLocalError("Format harus JPG, PNG, atau WEBP.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setLocalError("Ukuran file maksimal 2 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  const shown = preview ?? avatarUrl;

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-6">
      <h2 className="font-extrabold">Foto profil</h2>
      <Notice state={state} />
      {localError && <p className="mt-2 text-sm font-bold text-rose-600">{localError}</p>}
      <form action={action} className="mt-4 flex items-center gap-4">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar Buyer bisa dari S3/CDN eksternal
          <img src={shown} alt={name} className="h-16 w-16 rounded-full object-cover ring-1 ring-sand-200" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-lg font-extrabold text-brand-700 ring-1 ring-sand-200">
            {initials(name)}
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
          <button disabled={pending || !!localError} className="mt-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50">
            {pending ? "Mengunggah…" : "Unggah avatar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function ProfileForms({ profile, callbackUrl }: { profile: { name: string; email: string | null; phone: string | null; hasPassword: boolean; avatarUrl: string | null }; callbackUrl?: string }) {
  const [profileState, profileAction, profilePending] = useActionState(updateBuyerProfileAction, undefined);
  const [passwordState, passwordAction, passwordPending] = useActionState(changeBuyerPasswordAction, undefined);
  const input = "mt-1 min-h-11 w-full rounded-xl border border-sand-300 px-3";
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <AvatarForm name={profile.name} avatarUrl={profile.avatarUrl} />
      <form action={profileAction} className="space-y-4 rounded-2xl border border-sand-200 bg-white p-6">
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
        <h2 className="font-extrabold">Data profil</h2>
        <Notice state={profileState} />
        <label className="block text-sm font-bold">Nama<input name="name" defaultValue={profile.name} required className={input} /></label>
        <label className="block text-sm font-bold">Email<input value={profile.email ?? ""} disabled className={input} /></label>
        <label className="block text-sm font-bold">Nomor WhatsApp<input name="phone" defaultValue={profile.phone ?? ""} required className={input} /></label>
        <button disabled={profilePending} className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-extrabold text-white">{callbackUrl ? "Simpan & Kembali ke Checkout" : "Simpan profil"}</button>
      </form>
      {profile.hasPassword ? (
        <form action={passwordAction} className="space-y-4 rounded-2xl border border-sand-200 bg-white p-6">
          <h2 className="font-extrabold">Ganti kata sandi</h2>
          <Notice state={passwordState} />
          {[["currentPassword", "Kata sandi saat ini"], ["newPassword", "Kata sandi baru"], ["confirmPassword", "Ulangi kata sandi baru"]].map(([name, label]) => (
            <label key={name} className="block text-sm font-bold">{label}<input name={name} type="password" required minLength={8} className={input} /></label>
          ))}
          <button disabled={passwordPending} className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-extrabold text-white">Ganti kata sandi</button>
        </form>
      ) : (
        <section className="rounded-2xl border border-brand-200 bg-brand-50 p-6">
          <p className="text-xs font-extrabold uppercase tracking-wider text-brand-700">Akun Google</p>
          <h2 className="mt-2 font-extrabold text-sand-900">Kamu masuk tanpa kata sandi</h2>
          <p className="mt-2 text-sm leading-6 text-sand-600">Gunakan tombol Google saat masuk. Jika ingin menambahkan kata sandi, kirim tautan melalui fitur lupa kata sandi.</p>
          <Link href={`/account/forgot-password?email=${encodeURIComponent(profile.email ?? "")}`} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white">Buat kata sandi</Link>
        </section>
      )}
    </div>
  );
}
