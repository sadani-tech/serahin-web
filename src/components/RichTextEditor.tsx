"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// react-quill-new = fork Quill 2 yang kompatibel React 19 (tanpa findDOMNode).
// Dimuat client-only (ssr:false) karena Quill mengakses `document` saat import.
// Default `useSemanticHTML: true` → nilai onChange sudah berupa HTML semantik
// (<strong>/<em>/<ul>/<ol>/…) sehingga langsung cocok dengan sanitizer server
// dan renderer `RichText` (prose-serahin). Tidak ada lagi `document.execCommand`
// (penyebab auto-bold) maupun spasi antar-baris berlebih dari contenteditable.
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[220px] animate-pulse rounded-lg bg-sand-50" />
  ),
});

/**
 * Editor WYSIWYG (v1.6 3.1/3.2, ditingkatkan v1.8 ke Quill).
 * Nilai HTML disinkronkan ke <input type="hidden" name={name}> untuk dikirim
 * lewat form action; konten disanitasi lagi di server sebelum disimpan.
 */
export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder = "Tulis konten di sini…",
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [html, setHtml] = useState(defaultValue);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "link", "image"],
          ["clean"],
        ],
        handlers: {
          // Sisipkan gambar via URL (bukan base64) agar HTML tersimpan ringkas.
          image(this: { quill: import("quill").default }) {
            const url = window.prompt("Masukkan URL gambar (https://…)");
            if (!url) return;
            const range = this.quill.getSelection(true);
            this.quill.insertEmbed(range.index, "image", url, "user");
            this.quill.setSelection(range.index + 1, 0, "user");
          },
        },
      },
    }),
    [],
  );

  const formats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "list",
      "blockquote",
      "link",
      "image",
    ],
    [],
  );

  return (
    <div className="serahin-quill">
      <ReactQuill
        theme="snow"
        value={html}
        onChange={setHtml}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
