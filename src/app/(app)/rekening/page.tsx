import { redirect } from "next/navigation";
import { ToastFeedback } from "@/components/Toast";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import { saveBankAccount } from "./actions";
import { BankAccountsTable } from "./BankAccountsTable";

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
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">Pembayaran Seller</p>
        <h1 className="mt-1 text-3xl font-extrabold text-sand-900">Rekening transfer</h1>
        <p className="mt-1 max-w-2xl text-sm text-sand-500">Tambahkan rekening bank atau e-wallet. Rekening yang dipilih Buyer disimpan sebagai snapshot pada pesanan transfer manual.</p>
      </div>

      <ToastFeedback success={query.success} error={query.error} />

      <section className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <h2 className="font-extrabold text-brand-900">Tambah rekening</h2>
        <form action={saveBankAccount} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-sand-700">Jenis tujuan<select name="accountType" defaultValue="BANK" className={inputClass}><option value="BANK">Bank</option><option value="EWALLET">E-wallet</option></select></label>
          <label className="text-sm font-bold text-sand-700">Nama bank<input name="bankName" required minLength={2} maxLength={80} placeholder="BCA" className={inputClass}/></label>
          <label className="text-sm font-bold text-sand-700">Nomor rekening<input name="accountNumber" required inputMode="numeric" pattern="[0-9 .-]{5,40}" placeholder="1234567890" className={inputClass}/></label>
          <label className="text-sm font-bold text-sand-700 sm:col-span-2">Nama pemilik rekening<input name="accountHolderName" required minLength={2} maxLength={120} placeholder="Nama sesuai rekening" className={inputClass}/></label>
          <label className="flex items-center gap-2 text-sm font-bold text-sand-700"><input type="checkbox" name="isPrimary" value="1" defaultChecked={accounts.length === 0}/> Jadikan rekening utama</label>
          <div className="sm:text-right"><button className="min-h-11 rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white hover:bg-brand-700">Simpan rekening</button></div>
        </form>
      </section>

      <section className="space-y-3">
        <div><h2 className="text-lg font-extrabold text-sand-900">Rekening tersimpan</h2><p className="text-sm text-sand-500">Hanya satu rekening yang menjadi rekening utama pada satu waktu.</p></div>
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
