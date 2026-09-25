"use client";

import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

/**
 * Sort generik untuk tabel data yang sudah dimuat penuh di klien (v2.3.7
 * §3.19 — audit sortable table, PRD v2.3.8 FR-38.50). Klik header kolom
 * mengurutkan naik, klik lagi membalik ke turun; klik kolom lain reset ke
 * naik. `accessor` mengembalikan nilai pembanding (string/number/null) untuk
 * kunci kolom yang diberikan — null/undefined selalu didorong ke bawah.
 */
export function useSort<T>(
  rows: T[],
  accessor: (row: T, key: string) => string | number | null | undefined,
) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [direction, setDirection] = useState<SortDirection>("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = accessor(a, sortKey);
      const bv = accessor(b, sortKey);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv), "id-ID", { numeric: true });
    });
    if (direction === "desc") copy.reverse();
    return copy;
  }, [rows, sortKey, direction, accessor]);

  function toggle(key: string) {
    setSortKey((current) => {
      if (current === key) {
        setDirection((d) => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      setDirection("asc");
      return key;
    });
  }

  return { sorted, sortKey, direction, toggle };
}
