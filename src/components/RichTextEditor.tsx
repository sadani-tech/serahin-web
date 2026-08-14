"use client";

import { type ClipboardEvent, useEffect, useRef, useState } from "react";

/**
 * Editor WYSIWYG ringan berbasis contenteditable (v1.6 3.1/3.2).
 * Mendukung: bold, italic, heading, list, link, dan gambar inline (via URL).
 * Nilai HTML disinkronkan ke <input type="hidden" name={name}> untuk dikirim
 * lewat form action; konten disanitasi lagi di server sebelum disimpan.
 */
type Cmd = {
  label: string;
  title: string;
  run: (exec: (c: string, v?: string) => void) => void;
};

const COMMANDS: Cmd[][] = [
  [
    { label: "B", title: "Tebal", run: (e) => e("bold") },
    { label: "I", title: "Miring", run: (e) => e("italic") },
    { label: "U", title: "Garis bawah", run: (e) => e("underline") },
  ],
  [
    { label: "H1", title: "Judul 1", run: (e) => e("formatBlock", "<h1>") },
    { label: "H2", title: "Judul 2", run: (e) => e("formatBlock", "<h2>") },
    { label: "H3", title: "Judul 3", run: (e) => e("formatBlock", "<h3>") },
    { label: "¶", title: "Paragraf", run: (e) => e("formatBlock", "<p>") },
  ],
  [
    { label: "• List", title: "Daftar poin", run: (e) => e("insertUnorderedList") },
    { label: "1. List", title: "Daftar angka", run: (e) => e("insertOrderedList") },
    { label: "❝", title: "Kutipan", run: (e) => e("formatBlock", "<blockquote>") },
  ],
];

export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder = "Tulis konten di sini…",
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue);

  // Isi editor sekali di awal (uncontrolled agar kursor tidak melompat).
  useEffect(() => {
    // Enter memakai <p> (bukan <div> default Chrome). <div> tidak ada di
    // daftar tag sanitizer → akan dibuang & baris menyatu. <p> aman dan tersimpan.
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      // execCommand tidak tersedia (mis. saat SSR/test) — abaikan.
    }
    if (editorRef.current && editorRef.current.innerHTML !== defaultValue) {
      editorRef.current.innerHTML = defaultValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    if (editorRef.current) setHtml(editorRef.current.innerHTML);
  };

  // Tempel sebagai teks polos: buang format bawaan sumber (mis. bold dari
  // caption Instagram/WhatsApp) yang tadinya "menebal sendiri", tapi tetap
  // pertahankan pindah baris.
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    sync();
  };

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    sync();
  };

  const addLink = () => {
    const url = window.prompt("Masukkan URL tautan (https://…)");
    if (url) exec("createLink", url);
  };

  const addImage = () => {
    const url = window.prompt("Masukkan URL gambar (https://…)");
    if (url) exec("insertImage", url);
  };

  return (
    <div className="overflow-hidden rounded-lg ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-slate-900">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {COMMANDS.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {group.map((c) => (
              <button
                key={c.label}
                type="button"
                title={c.title}
                onClick={() => c.run(exec)}
                className="rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                {c.label}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-slate-300" />
          </div>
        ))}
        <button
          type="button"
          title="Sisipkan tautan"
          onClick={addLink}
          className="rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
        >
          🔗 Link
        </button>
        <button
          type="button"
          title="Sisipkan gambar (URL)"
          onClick={addImage}
          className="rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
        >
          🖼 Gambar
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="prose-serahin min-h-[220px] max-w-none px-4 py-3 text-sm focus:outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
      />

      <input type="hidden" name={name} value={html} />
    </div>
  );
}
