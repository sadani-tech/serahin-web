import Link from "next/link";

/**
 * Identitas visual Serahin (v1.9).
 *
 * Lambang: keranjang belanja bertangkai dengan hati tersenyum di tengah dan
 * pancaran sinar di atasnya — "Pesan hari ini, terima dengan hati".
 * Digambar sebagai SVG inline (bukan file gambar) supaya tajam di semua
 * ukuran, ikut warna tema, dan tidak menambah request jaringan.
 */

type MarkTone = "color" | "onDark" | "mono";

const TONE: Record<
  MarkTone,
  { outline: string; body: string; heart: string; ray: string }
> = {
  // Di latar terang: garis hijau brand, badan krem, hati & sinar oranye.
  color: {
    outline: "var(--color-brand-500)",
    body: "var(--color-cream)",
    heart: "var(--color-accent-500)",
    ray: "var(--color-accent-500)",
  },
  // Di latar gelap/hijau: garis krem agar tetap terbaca, hati kuning cerah.
  onDark: {
    outline: "var(--color-cream)",
    body: "transparent",
    heart: "var(--color-sun-400)",
    ray: "var(--color-sun-400)",
  },
  // Satu warna mengikuti currentColor (mis. di dalam tombol).
  mono: {
    outline: "currentColor",
    body: "transparent",
    heart: "currentColor",
    ray: "currentColor",
  },
};

export function SerahinMark({
  className = "h-8 w-8",
  tone = "color",
  withRays = true,
}: {
  className?: string;
  tone?: MarkTone;
  withRays?: boolean;
}) {
  const c = TONE[tone];
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Serahin"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Pancaran sinar */}
      {withRays && (
        <g stroke={c.ray} strokeWidth={3.2}>
          <path d="M32 10.5V5.5" />
          <path d="M40.5 11.9L42.6 7.3" />
          <path d="M23.5 11.9L21.4 7.3" />
          <path d="M47.3 17.1L51.2 13.9" />
          <path d="M16.7 17.1L12.9 13.9" />
        </g>
      )}

      {/* Tangkai keranjang */}
      <path
        d="M24 27V24a8 8 0 0 1 16 0v3"
        stroke={c.outline}
        strokeWidth={3.4}
      />

      {/* Badan keranjang */}
      <path
        d="M17 27h30q4 0 3.4 4L47.6 46.5Q47 51.5 43 51.5H21Q17 51.5 16.4 46.5L13.6 31Q13 27 17 27Z"
        fill={c.body}
        stroke={c.outline}
        strokeWidth={3.4}
      />

      {/* Titik sambungan tangkai */}
      <g fill={c.outline}>
        <circle cx="24" cy="27" r="2.6" />
        <circle cx="40" cy="27" r="2.6" />
      </g>

      {/* Hati tersenyum */}
      <path
        d="M32 45c0 0-8.4-5.2-8.4-9.7 0-2.7 2.1-4.4 4.4-4.4 1.9 0 3.4 1.2 4 2.5.6-1.3 2.1-2.5 4-2.5 2.3 0 4.4 1.7 4.4 4.4C40.4 39.8 32 45 32 45Z"
        stroke={c.heart}
        strokeWidth={3}
      />
      <path d="M29.6 36.8q2.4 2.6 4.8 0" stroke={c.heart} strokeWidth={2.4} />
    </svg>
  );
}

/**
 * Lambang + kata "Serahin" (opsional dengan tagline).
 * `href` membuat seluruh logo bisa diklik menuju beranda.
 */
export function SerahinLogo({
  size = "md",
  tone = "color",
  withTagline = false,
  layout = "inline",
  href,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  tone?: MarkTone;
  withTagline?: boolean;
  /** `inline` = lambang di kiri teks (header); `stacked` = lambang di atas (hero). */
  layout?: "inline" | "stacked";
  href?: string;
  className?: string;
}) {
  const dims = {
    sm: { mark: "h-7 w-7", stackMark: "h-12 w-12", text: "text-lg" },
    md: { mark: "h-9 w-9", stackMark: "h-14 w-14", text: "text-xl" },
    lg: { mark: "h-12 w-12", stackMark: "h-20 w-20", text: "text-3xl" },
  }[size];

  const wordColor = tone === "onDark" ? "text-cream" : "text-brand-600";
  const taglineColor = tone === "onDark" ? "text-cream/75" : "text-sand-500";
  const stacked = layout === "stacked";

  const tagline = withTagline && (
    <span
      className={`font-bold uppercase tracking-[0.14em] ${
        stacked ? "text-[0.62rem]" : "text-[0.55rem]"
      } ${taglineColor}`}
    >
      Pesan hari ini, terima dengan hati
    </span>
  );

  const inner = stacked ? (
    <span className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <SerahinMark className={dims.stackMark} tone={tone} />
      <span
        className={`font-extrabold leading-none tracking-tight ${dims.text} ${wordColor}`}
      >
        Serahin
      </span>
      {tagline}
    </span>
  ) : (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <SerahinMark className={dims.mark} tone={tone} />
      {/* text-left agar tidak ikut `text-center` dari induk (mis. hero). */}
      <span className="inline-flex flex-col gap-1 text-left leading-none">
        <span
          className={`font-extrabold leading-none tracking-tight ${dims.text} ${wordColor}`}
        >
          Serahin
        </span>
        {tagline}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {inner}
      </Link>
    );
  }
  return inner;
}
