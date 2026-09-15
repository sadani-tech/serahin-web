"use client";
import { useEffect } from "react";
export function ClearDraft({ campaign }: { campaign?: string }) {
  useEffect(() => { if (campaign) localStorage.removeItem(`serahin:checkout:${campaign}`); }, [campaign]);
  return null;
}
