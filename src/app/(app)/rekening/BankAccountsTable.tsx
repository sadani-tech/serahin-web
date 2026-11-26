"use client";

import { useState } from "react";
import { deleteBankAccount, saveBankAccount } from "./actions";
import { DeleteBankAccountButton } from "./DeleteBankAccountButton";
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
const TYPE_LABEL: Record<BankAccount["accountType"], string> = { BANK: "Bank", EWALLET: "E-wallet" };

function EditForm({ account, onCancel }: { account: BankAccount; onCancel: () => void }) {
  return (
    <form action={saveBankAccount} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={account.id} />
      <label className="text-xs font-bold text-sand-700">
        Jenis tujuan
        <Select name="accountType" defaultValue={account.accountType} className={inputClass}>
          <option value="BANK">Bank</option>
          <option value="EWALLET">E-wallet</option>
        </Select>
      </label>
      <label className="text-xs font-bold text-sand-700">
        Bank atau penyedia e-wallet
        <input name="bankName" required defaultValue={account.bankName} className={inputClass} />
      </label>
      <label className="text-xs font-bold text-sand-700">
        Nomor rekening
        <input name="accountNumber" required inputMode="numeric" pattern="[0-9 .-]{5,40}" defaultValue={account.accountNumber} className={inputClass} />
      </label>
      <label className="text-xs font-bold text-sand-700">
        Nama pemilik
        <input name="accountHolderName" required defaultValue={account.accountHolderName} className={inputClass} />
      </label>
      <label className="flex items-center gap-2 text-xs font-bold text-sand-700 sm:col-span-2">
        <input type="checkbox" name="isPrimary" value="1" defaultChecked={account.isPrimary} disabled={account.isPrimary} />
        {account.isPrimary ? "Rekening utama (pilih rekening lain untuk mengganti)" : "Jadikan rekening utama"}
      </label>
      <label className="flex items-center gap-2 text-xs font-bold text-sand-700 sm:col-span-2">
        <input type="checkbox" name="isActive" value="1" defaultChecked={account.isActive} />
        Tampilkan ke Buyer (aktif)
      </label>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" onClick={onCancel} className="min-h-10 rounded-xl px-4 text-sm font-bold text-sand-600 hover:bg-sand-100">
          Batal
        </button>
        <button className="min-h-10 rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white">Simpan perubahan</button>
      </div>
    </form>
  );
}

function Badges({ account }: { account: BankAccount }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[11px] font-bold text-sand-600">{TYPE_LABEL[account.accountType]}</span>
      {account.isPrimary && (
        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-extrabold text-brand-800">Utama</span>
      )}
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
          account.isActive ? "bg-emerald-50 text-emerald-700" : "bg-sand-100 text-sand-500"
        }`}
      >
        {account.isActive ? "Aktif" : "Nonaktif"}
      </span>
    </span>
  );
}

export function BankAccountsTable({ accounts }: { accounts: BankAccount[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2">
        {accounts.map((account) => (
          <li key={account.id} className={`min-w-0 rounded-2xl border p-4 ${account.isPrimary ? "border-brand-300 bg-brand-50/50" : "border-sand-200 bg-white"}`}>
            {editingId === account.id ? (
              <div className="rounded-xl border border-sand-200 bg-sand-50 p-3">
                <EditForm account={account} onCancel={() => setEditingId(null)} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="min-w-0">
                  <div className="mb-3"><Badges account={account} /></div>
                  <p className="text-lg font-extrabold text-sand-900">{account.bankName}</p>
                  <p className="mt-1 break-all font-mono text-sm text-sand-700">{account.accountNumber}</p>
                  <p className="mt-3 text-xs text-sand-500">Atas nama</p><p className="font-bold text-sand-800">{account.accountHolderName}</p>
                </div>
                <div className="flex items-center gap-2 border-t border-sand-200 pt-3">
                  <button onClick={() => setEditingId(account.id)} className="min-h-10 flex-1 rounded-xl border border-brand-300 px-3 text-sm font-bold text-brand-700">
                    Edit
                  </button>
                  <DeleteBankAccountButton action={deleteBankAccount.bind(null, account.id)} />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>


    </>
  );
}
