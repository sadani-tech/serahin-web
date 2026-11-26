import Link from "next/link";
import { api } from "@/lib/api";
import { updateSellerProfile } from "./actions";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { LogoForm } from "./LogoForm";
import { PhoneChangeForm } from "./PhoneChangeForm";

type SellerProfile = { businessName: string; slug: string; description: string | null; logoUrl: string | null; contactEmail: string | null; contactPhone: string | null; status: string };
type PhoneRequest = { id: string; newPhone: string; status: string; decisionReason: string | null; createdAt: string };
const input = "mt-1 block min-h-11 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 font-normal outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default async function SellerProfilePage() {
  const [profile, requests] = await Promise.all([
    api.get<SellerProfile>("/seller/profile"),
    api.get<PhoneRequest[]>("/seller/profile/phone-change-requests"),
  ]);
  return <div className="mx-auto max-w-5xl space-y-6 pb-8">
    <header className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-100">Identitas toko</p>
      <h1 className="mt-2 text-3xl font-extrabold">Pengaturan toko</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-50">Perbarui informasi yang dilihat pembeli dan jaga keamanan akun toko Anda.</p>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm"><span className="rounded-full bg-white/15 px-3 py-1 font-bold">{profile.status}</span><Link href={`/store/${profile.slug}`} className="break-all rounded-full bg-white px-3 py-1 font-bold text-brand-800">Lihat toko /store/{profile.slug} ↗</Link></div>
    </header>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="space-y-6">
        <section className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5"><h2 className="text-lg font-extrabold text-sand-900">Informasi publik</h2><p className="mt-1 text-sm text-sand-500">Nama, deskripsi, dan email tampil di halaman toko.</p></div>
          <form action={updateSellerProfile} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-sand-700">Nama bisnis<input name="businessName" required minLength={2} defaultValue={profile.businessName} className={input}/></label>
            <label className="text-sm font-bold text-sand-700">Email kontak<input name="contactEmail" type="email" required defaultValue={profile.contactEmail ?? ""} className={input}/></label>
            <label className="text-sm font-bold text-sand-700 sm:col-span-2">Deskripsi toko<textarea name="description" required rows={5} defaultValue={profile.description ?? ""} className={input}/></label>
            <div className="sm:col-span-2"><button className="min-h-11 w-full rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white hover:bg-brand-700 sm:w-auto">Simpan profil</button></div>
          </form>
        </section>
        <PhoneChangeForm currentPhone={profile.contactPhone} requests={requests}/>
        <ChangePasswordForm />
      </div>
      <div className="space-y-6"><LogoForm businessName={profile.businessName} logoUrl={profile.logoUrl}/><div className="rounded-2xl border border-brand-200 bg-brand-50 p-5"><h2 className="font-extrabold text-brand-900">Kelola penjualan</h2><p className="mt-2 text-sm leading-6 text-brand-800">Promo dikelola terpisah dan bisa dipilih untuk Batch PO tertentu.</p><Link href="/seller/promotions" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-bold text-brand-700">Buka promo →</Link></div></div>
    </div>
  </div>;
}
