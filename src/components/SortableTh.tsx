"use client";

/** Header kolom tabel yang bisa diklik untuk sort (v2.3.7 §3.19). */
export function SortableTh({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
}: {
  label: string;
  sortKey: string;
  activeKey: string | null;
  direction: "asc" | "desc";
  onSort: (key: string) => void;
  /** Ganti total padding/typography default (`px-5 py-3 font-medium`) bila
   * tabel pemanggil pakai spacing berbeda — dihindari append supaya tidak
   * kena bug cascade Tailwind (className override tertimpa, lihat v2.3.7 3.7). */
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th className={className ?? "px-5 py-3 font-medium"}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-sand-900 ${active ? "text-sand-900" : ""}`}
      >
        {label}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3 w-3 shrink-0 transition-transform ${active ? "opacity-100" : "opacity-30"} ${active && direction === "desc" ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </th>
  );
}
