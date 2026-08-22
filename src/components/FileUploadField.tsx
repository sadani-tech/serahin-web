"use client";

import { useRef, useState } from "react";
import { Field, Input } from "@/components/ui";
import { useConfirm } from "@/components/ConfirmDialog";

// Field upload berkas dengan pratinjau gambar / label PDF + validasi ukuran.
// Dipakai untuk unggah bukti pembayaran di formulir pemesanan.

const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

export function FileUploadField({
  name,
  label = "Bukti pembayaran",
  hint = "JPG, PNG, WEBP, atau PDF (maks 5MB)",
  required = false,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 5,
}: {
  name: string;
  label?: string;
  hint?: string;
  required?: boolean;
  accept?: string;
  maxSizeMB?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const { alert } = useConfirm();

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      reset();
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      void alert({
        title: "File terlalu besar",
        description: `Ukuran file melebihi batas maksimal ${maxSizeMB}MB.`,
      });
      reset();
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFileName(file.name);
    setPreview(file.type === "application/pdf" ? null : URL.createObjectURL(file));
  };

  const isPdf = fileName.toLowerCase().endsWith(".pdf");

  return (
    <Field label={label} hint={hint} required={required}>
      <Input
        ref={inputRef}
        name={name}
        type="file"
        accept={accept}
        required={required}
        onChange={handleChange}
        className="file:mr-3 file:rounded-md file:border-0 file:bg-sand-100 file:px-3 file:py-1 file:text-sm"
      />
      {fileName ? (
        <div className="mt-2 space-y-1">
          {preview && !isPdf ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Pratinjau bukti pembayaran"
              className="max-h-48 rounded-lg border border-sand-200"
            />
          ) : (
            <div className="rounded-lg border border-sand-200 bg-sand-50 px-3 py-2 text-sm text-sand-700">
              📄 {fileName}
            </div>
          )}
          <button
            type="button"
            onClick={reset}
            className="text-xs text-rose-600 hover:text-rose-700"
          >
            Hapus
          </button>
        </div>
      ) : null}
    </Field>
  );
}
