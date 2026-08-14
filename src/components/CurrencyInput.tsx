"use client";

import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui";

// Input nominal uang dengan pemisah ribuan titik (format id-ID): 1.000, 10.000,
// 100.000. Menampilkan nilai terformat, tetapi mengirim angka mentah (digit
// saja) lewat <input hidden> sehingga server action tetap menerima number bersih
// tanpa perlu diubah.

function digitsOnly(v: string | number | null | undefined): string {
  return String(v ?? "").replace(/\D/g, "");
}

export function formatThousands(v: string | number | null | undefined): string {
  const d = digitsOnly(v);
  return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
}

type CurrencyInputProps = Omit<
  ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  /** Nama field yang dikirim (dipasang pada input hidden berisi digit mentah). */
  name?: string;
  /** Nilai terkontrol (angka mentah). */
  value?: string | number;
  /** Nilai awal tak-terkontrol (angka mentah). */
  defaultValue?: string | number;
  /** Callback saat berubah — menerima digit mentah (tanpa titik). */
  onValueChange?: (raw: string) => void;
};

export function CurrencyInput({
  name,
  value,
  defaultValue,
  onValueChange,
  ...rest
}: CurrencyInputProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string>(digitsOnly(defaultValue));
  const raw = isControlled ? digitsOnly(value) : internal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = digitsOnly(e.target.value);
    if (!isControlled) setInternal(d);
    onValueChange?.(d);
  };

  return (
    <>
      <Input
        {...rest}
        type="text"
        inputMode="numeric"
        value={formatThousands(raw)}
        onChange={handleChange}
      />
      {name ? <input type="hidden" name={name} value={raw} /> : null}
    </>
  );
}
