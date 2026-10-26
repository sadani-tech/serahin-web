/** Ubah teks bebas menjadi slug URL aman (huruf kecil, tanda hubung). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function toPublicSlug(value: string) {
  return slugify(value) || "others";
}
