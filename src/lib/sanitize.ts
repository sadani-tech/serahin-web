import sanitizeHtml from "sanitize-html";

/**
 * Sanitasi HTML dari editor WYSIWYG (v1.6 3.1/3.2).
 * Izinkan hanya tag yang dihasilkan editor: bold/italic/heading/list/link/
 * gambar inline/paragraf. Mencegah XSS dari konten yang tersimpan.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "div",
    "br",
    "b",
    "strong",
    "i",
    "em",
    "u",
    "s",
    "h1",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "blockquote",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
  },
  // Hanya izinkan skema aman untuk link & gambar (termasuk data URI gambar).
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
  },
  transformTags: {
    // Paksa link eksternal aman dari tab-nabbing.
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer nofollow",
    }),
  },
};

// Deteksi apakah konten sudah punya struktur baris sendiri (blok atau <br>).
const HAS_LINE_STRUCTURE = /<(?:p|div|br|h[1-3]|ul|ol|li|blockquote)\b/i;

export function sanitizeRichText(html: string): string {
  // Teks polos (mis. hasil import Excel) memakai newline "\n" untuk pindah
  // baris, tapi HTML mengabaikannya. Ubah newline ke <br> — hanya bila konten
  // belum punya struktur baris sendiri, agar tidak menghasilkan baris dobel.
  const normalized = HAS_LINE_STRUCTURE.test(html)
    ? html
    : html.replace(/\r\n|\r|\n/g, "<br />");
  return sanitizeHtml(normalized, OPTIONS);
}

/** True bila konten kosong setelah tag dilepas (untuk validasi form). */
export function isRichTextEmpty(html: string): boolean {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .trim().length === 0;
}

/** Ubah rich-text HTML jadi teks polos (mis. untuk tombol salin ke clipboard). */
export function richTextToPlain(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .trim();
}
