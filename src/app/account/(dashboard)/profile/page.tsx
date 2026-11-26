import Link from "next/link";
import { api } from "@/lib/api";
import { ProfileForms } from "./ProfileForms";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const [profile, { callbackUrl }] = await Promise.all([
    api.get<{ name: string; email: string | null; phone: string | null; hasPassword: boolean; avatarUrl: string | null }>("/auth/buyer/profile"),
    searchParams,
  ]);
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-5 pb-10 sm:px-6 sm:py-8">
    <Link href="/account" className="inline-flex min-h-10 items-center text-sm font-bold text-brand-700">← Kembali ke pesanan</Link>
    <header className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white sm:p-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-100">Akun Buyer</p><h1 className="mt-2 text-3xl font-extrabold">Profil saya</h1><p className="mt-2 max-w-xl text-sm leading-6 text-brand-50">Atur identitas, kontak WhatsApp, dan keamanan akun untuk memudahkan transaksi berikutnya.</p><p className="mt-5 inline-block max-w-full break-all rounded-full bg-white/15 px-4 py-2 text-sm font-bold">{profile.email || profile.name}</p></header>
    <ProfileForms profile={profile} callbackUrl={callbackUrl}/>
  </main>;
}
