import { redirect } from "next/navigation";
import { ToastFeedback } from "@/components/Toast";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
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

      <section className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm sm:p-6">
        <BankAccountsTable accounts={accounts} />
        {accounts.length === 0 && <p className="mt-4 rounded-xl border border-dashed border-sand-300 bg-sand-50 p-6 text-center text-sm text-sand-600">Belum ada rekening. Tambahkan rekening pertama agar Buyer dapat memilih transfer manual.</p>}
      </section>
    </div>
  );
}
