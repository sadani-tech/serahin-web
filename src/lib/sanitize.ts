import sanitizeHtml from "sanitize-html";

/**
 * Sanitasi HTML dari editor WYSIWYG (v1.6 3.1/3.2).
 * Izinkan hanya tag yang dihasilkan editor: bold/italic/heading/list/link/
 * gambar inline/paragraf. Mencegah XSS dari konten yang tersimpan.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
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

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}

/** True bila konten kosong setelah tag dilepas (untuk validasi form). */
export function isRichTextEmpty(html: string): boolean {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .trim().length === 0;
}
