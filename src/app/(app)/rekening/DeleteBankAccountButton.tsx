"use client";

export function DeleteBankAccountButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Hapus rekening ini dari pilihan transfer Seller?")) event.preventDefault();
      }}
    >
      <button type="submit" className="min-h-10 rounded-xl border border-rose-200 px-3 text-sm font-bold text-rose-700 hover:bg-rose-50">
        Hapus
      </button>
    </form>
  );
}
