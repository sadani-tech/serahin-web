"use client";

import { Fragment, useState } from "react";
import { deleteBankAccount, saveBankAccount } from "./actions";
import { DeleteBankAccountButton } from "./DeleteBankAccountButton";
import { Select } from "@/components/ui";
import { useSort } from "@/hooks/useSort";
import { SortableTh } from "@/components/SortableTh";

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
        Nama bank
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
  const { sorted, sortKey, direction, toggle: toggleSort } = useSort(accounts, (a, key) => {
    switch (key) {
      case "bank": return a.bankName;
      case "nomor": return a.accountNumber;
      case "nama": return a.accountHolderName;
      case "status": return a.isActive ? 1 : 0;
      default: return null;
    }
  });

  return (
    <>
      {/* Mobile: compact card list */}
      <ul className="divide-y divide-sand-100 md:hidden">
        {accounts.map((account) => (
          <li key={account.id} className="py-3">
            {editingId === account.id ? (
              <div className="rounded-xl border border-sand-200 bg-sand-50 p-3">
                <EditForm account={account} onCancel={() => setEditingId(null)} />
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-sand-900">
                    {account.bankName} · <span className="font-mono">{account.accountNumber}</span>
                  </p>
                  <p className="mt-0.5 truncate text-sm text-sand-500">a.n. {account.accountHolderName}</p>
                  <div className="mt-1.5"><Badges account={account} /></div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <button onClick={() => setEditingId(account.id)} className="text-xs font-bold text-brand-700 underline underline-offset-2">
                    Edit
                  </button>
                  <DeleteBankAccountButton action={deleteBankAccount.bind(null, account.id)} />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-sand-500">
            <SortableTh label="Bank / E-wallet" sortKey="bank" activeKey={sortKey} direction={direction} onSort={toggleSort} className="py-2 pr-3 font-medium" />
            <SortableTh label="Nomor" sortKey="nomor" activeKey={sortKey} direction={direction} onSort={toggleSort} className="py-2 pr-3 font-medium" />
            <SortableTh label="Atas nama" sortKey="nama" activeKey={sortKey} direction={direction} onSort={toggleSort} className="py-2 pr-3 font-medium" />
            <SortableTh label="Status" sortKey="status" activeKey={sortKey} direction={direction} onSort={toggleSort} className="py-2 pr-3 font-medium" />
            <th className="py-2 pr-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-sand-100">
          {sorted.map((account) => (
            <Fragment key={account.id}>
              <tr className="align-top">
                <td className="py-3 pr-3 font-bold text-sand-900">{account.bankName}</td>
                <td className="py-3 pr-3 font-mono text-sand-700">{account.accountNumber}</td>
                <td className="py-3 pr-3 text-sand-700">{account.accountHolderName}</td>
                <td className="py-3 pr-3"><Badges account={account} /></td>
                <td className="py-3 pr-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(editingId === account.id ? null : account.id)}
                      className="min-h-9 rounded-lg border border-sand-300 px-3 text-xs font-bold text-sand-700 hover:bg-sand-50"
                    >
                      {editingId === account.id ? "Tutup" : "Edit"}
                    </button>
                    <DeleteBankAccountButton action={deleteBankAccount.bind(null, account.id)} />
                  </div>
                </td>
              </tr>
              {editingId === account.id && (
                <tr>
                  <td colSpan={5} className="bg-sand-50 px-3 py-4">
                    <EditForm account={account} onCancel={() => setEditingId(null)} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
}
