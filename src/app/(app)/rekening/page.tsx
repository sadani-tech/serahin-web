import { redirect } from "next/navigation";
import { ToastFeedback } from "@/components/Toast";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import { saveBankAccount } from "./actions";
import { BankAccountsTable } from "./BankAccountsTable";
import { Select } from "@/components/ui";

type BankAccount = {
  id: string;
  accountType: "BANK" | "EWALLET";
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isPrimary: boolean;
  isActive: boolean;
};

const inputClass = "mt-1 block min-h-11 w-full rounded-xl border border-sand-300 bg-white px-3 font-normal";

export default async function BankAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const [session, query] = await Promise.all([
    getSession(),
    searchParams,
  ]);
  if (session?.role !== "SELLER") redirect("/dashboard");
  const accounts = await api.get<BankAccount[]>("/seller/bank-accounts");

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <header className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-100">Pembayaran Seller</p>
        <h1 className="mt-2 text-3xl font-extrabold">Rekening transfer</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-50">Atur rekening penerima transfer manual yang dapat dipilih Buyer saat checkout.</p>
      </header>

      <ToastFeedback success={query.success} error={query.error} />

      <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-sand-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-sand-500">Rekening aktif</p><p className="mt-2 text-3xl font-extrabold text-sand-900">{accounts.filter((account) => account.isActive).length}</p><p className="mt-1 text-sm text-sand-500">Tersedia untuk Buyer</p></div><div className="rounded-2xl border border-brand-200 bg-brand-50 p-5"><p className="text-xs font-bold uppercase tracking-wide text-brand-700">Rekening utama</p><p className="mt-2 break-all text-xl font-extrabold text-brand-900">{accounts.find((account) => account.isPrimary)?.bankName ?? "Belum dipilih"}</p><p className="mt-1 text-sm text-brand-800">{accounts.find((account) => account.isPrimary)?.accountNumber ?? "Tambahkan rekening pertama"}</p></div></div>

      <details className="group rounded-2xl border border-sand-200 bg-white p-5 shadow-sm" open={accounts.length === 0}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3"><span><span className="block text-lg font-extrabold text-sand-900">Tambah rekening</span><span className="mt-1 block text-sm text-sand-500">Bank atau e-wallet baru untuk transfer manual</span></span><span className="rounded-full bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700 group-open:rotate-45">＋</span></summary>
        <form action={saveBankAccount} className="mt-5 grid gap-4 border-t border-sand-100 pt-5 sm:grid-cols-2">
          <label className="text-sm font-bold text-sand-700">Jenis tujuan<Select name="accountType" defaultValue="BANK" className={inputClass}><option value="BANK">Bank</option><option value="EWALLET">E-wallet</option></Select></label>
          <label className="text-sm font-bold text-sand-700">Bank atau penyedia e-wallet<input name="bankName" required minLength={2} maxLength={80} placeholder="BCA / DANA" className={inputClass}/></label>
          <label className="text-sm font-bold text-sand-700">Nomor rekening<input name="accountNumber" required inputMode="numeric" pattern="[0-9 .-]{5,40}" placeholder="1234567890" className={inputClass}/></label>
          <label className="text-sm font-bold text-sand-700 sm:col-span-2">Nama pemilik rekening<input name="accountHolderName" required minLength={2} maxLength={120} placeholder="Nama sesuai rekening" className={inputClass}/></label>
          <label className="flex items-center gap-2 text-sm font-bold text-sand-700"><input type="checkbox" name="isPrimary" value="1" defaultChecked={accounts.length === 0}/> Jadikan rekening utama</label>
          <div className="sm:text-right"><button className="min-h-11 w-full rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white hover:bg-brand-700 sm:w-auto">Simpan rekening</button></div>
        </form>
      </details>

      <section className="space-y-3">
        <div><h2 className="text-lg font-extrabold text-sand-900">Rekening tersimpan</h2><p className="text-sm text-sand-500">Satu rekening utama ditandai jelas. Nonaktifkan rekening untuk menyembunyikannya dari Buyer.</p></div>
        {accounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-8 text-center text-sm text-sand-500">Belum ada rekening. Transfer manual belum tersedia untuk Buyer.</div>
        ) : (
          <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm sm:p-5">
            <BankAccountsTable accounts={accounts} />
          </div>
        )}
      </section>
    </div>
  );
}
