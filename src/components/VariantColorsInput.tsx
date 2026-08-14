"use client";

import { useState } from "react";
import { Input } from "@/components/ui";

// Input opsi warna varian (chips). Nilai berupa array nama warna.
export function VariantColorsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (warna: string[]) => void;
}) {
  const [text, setText] = useState("");

  const add = () => {
    const t = text.trim();
    if (t && !value.some((w) => w.toLowerCase() === t.toLowerCase())) {
      onChange([...value, t]);
    }
    setText("");
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs font-medium text-slate-700"
            >
              {c}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Hapus ${c}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-slate-300 hover:text-slate-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="mis. Merah, lalu Enter"
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-700"
        >
          Tambah
        </button>
      </div>
    </div>
  );
}
