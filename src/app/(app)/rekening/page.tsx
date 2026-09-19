import { redirect } from "next/navigation";
import { ToastFeedback } from "@/components/Toast";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import { deleteBankAccount, saveBankAccount } from "./actions";
import { DeleteBankAccountButton } from "./DeleteBankAccountButton";

type BankAccount = {
  id: string;
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
        <p className="mt-1 max-w-2xl text-sm text-sand-500">Rekening utama akan disimpan sebagai snapshot pada pesanan transfer manual, sehingga Buyer selalu melihat tujuan pembayaran yang tepat.</p>
      </div>

      <ToastFeedback success={query.success} error={query.error} />

      <section className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <h2 className="font-extrabold text-brand-900">Tambah rekening</h2>
        <form action={saveBankAccount} className="mt-4 grid gap-4 sm:grid-cols-2">
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
        ) : accounts.map((account) => (
          <article key={account.id} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-extrabold text-sand-900">{account.bankName} · <span className="font-mono">{account.accountNumber}</span></p><p className="text-sm text-sand-500">a.n. {account.accountHolderName}</p></div>
              {account.isPrimary && <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-extrabold text-brand-800">Rekening utama</span>}
            </div>
            <form action={saveBankAccount} className="grid gap-4 border-t border-sand-100 pt-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={account.id}/>
              <label className="text-sm font-bold text-sand-700">Nama bank<input name="bankName" required defaultValue={account.bankName} className={inputClass}/></label>
              <label className="text-sm font-bold text-sand-700">Nomor rekening<input name="accountNumber" required inputMode="numeric" pattern="[0-9 .-]{5,40}" defaultValue={account.accountNumber} className={inputClass}/></label>
              <label className="text-sm font-bold text-sand-700 sm:col-span-2">Nama pemilik<input name="accountHolderName" required defaultValue={account.accountHolderName} className={inputClass}/></label>
              <label className="flex items-center gap-2 text-sm font-bold text-sand-700"><input type="checkbox" name="isPrimary" value="1" defaultChecked={account.isPrimary} disabled={account.isPrimary}/> {account.isPrimary ? "Rekening utama (pilih rekening lain untuk mengganti)" : "Jadikan rekening utama"}</label>
              <div className="flex justify-end gap-2"><button className="min-h-10 rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white">Simpan perubahan</button></div>
            </form>
            <div className="mt-3 flex justify-end"><DeleteBankAccountButton action={deleteBankAccount.bind(null, account.id)}/></div>
          </article>
        ))}
      </section>
    </div>
  );
}
