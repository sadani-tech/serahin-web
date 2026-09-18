import Link from "next/link";
import { api } from "@/lib/api";
import { updateSellerProfile } from "./actions";

type SellerProfile = { businessName: string; slug: string; description: string | null; logoUrl: string | null; contactEmail: string | null; contactPhone: string | null; status: string };

export default async function SellerDashboardPage() {
  const profile = await api.get<SellerProfile>("/seller/profile");
  const links = [{ href: "/pre-orders", label: "Kelola Batch PO" }, { href: "/pesanan", label: "Kelola Pesanan" }, { href: "/verifikasi", label: "Verifikasi Pesanan" }, { href: "/pembeli", label: "Data Pembeli" }, { href: "/vendor", label: "Kelola Vendor" }, { href: "/konten/faq", label: "Kelola FAQ" }, { href: "/import", label: "Import Data" }, { href: "/export", label: "Export Data" }];
  return <div className="mx-auto max-w-5xl">
    <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">Seller Dashboard</p><h1 className="mt-2 text-3xl font-extrabold text-sand-900">{profile.businessName}</h1><p className="mt-1 text-sm text-sand-600">Status {profile.status} · /s/{profile.slug}</p></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{links.map((item) => <Link key={item.href} href={item.href} className="rounded-2xl border border-sand-200 bg-white p-6 font-extrabold text-brand-800 shadow-sm hover:border-brand-400">{item.label}</Link>)}</div>
    <section id="profil-bisnis" className="mt-8 scroll-mt-24 rounded-2xl border border-sand-200 bg-white p-6"><h2 className="text-xl font-extrabold">Profil bisnis</h2><p className="mt-1 text-sm text-sand-500">Perubahan profil langsung dipakai pada storefront publik.</p>
      <form action={updateSellerProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-sand-700">Nama bisnis<input name="businessName" required minLength={2} defaultValue={profile.businessName} className="mt-1 block min-h-11 w-full rounded-xl border border-sand-300 px-3 font-normal"/></label>
        <label className="text-sm font-bold text-sand-700">Email kontak<input name="contactEmail" type="email" required defaultValue={profile.contactEmail ?? ""} className="mt-1 block min-h-11 w-full rounded-xl border border-sand-300 px-3 font-normal"/></label>
        <label className="text-sm font-bold text-sand-700">Telepon<input name="contactPhone" required minLength={6} defaultValue={profile.contactPhone ?? ""} className="mt-1 block min-h-11 w-full rounded-xl border border-sand-300 px-3 font-normal"/></label>
        <label className="text-sm font-bold text-sand-700">URL logo<input name="logoUrl" type="url" defaultValue={profile.logoUrl ?? ""} className="mt-1 block min-h-11 w-full rounded-xl border border-sand-300 px-3 font-normal"/></label>
        <label className="text-sm font-bold text-sand-700 sm:col-span-2">Deskripsi<textarea name="description" required rows={5} defaultValue={profile.description ?? ""} className="mt-1 block w-full rounded-xl border border-sand-300 px-3 py-2 font-normal"/></label>
        <div className="sm:col-span-2"><button className="min-h-11 rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white">Simpan profil</button></div>
      </form>
    </section>
  </div>;
}
