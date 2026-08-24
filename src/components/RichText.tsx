import { sanitizeRichText } from "@/lib/sanitize";

/**
 * Render konten HTML rich-text yang sudah tersanitasi (v1.6 3.1/3.2).
 * Konten disanitasi ulang saat render sebagai lapis pertahanan kedua.
 */
export function RichText({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={`prose-serahin ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  );
}
