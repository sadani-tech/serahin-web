import Image from "next/image";
import Link from "next/link";

/** Brand assets v2.3.2 sourced from libraries/serahin-docs/serahin-icons. */
type MarkTone = "color" | "onDark" | "mono";

export function SerahinMark({
  className = "h-8 w-8",
  tone: _tone = "color",
  withRays: _withRays = true,
}: {
  className?: string;
  tone?: MarkTone;
  withRays?: boolean;
}) {
  void _tone;
  void _withRays;
  return (
    <Image
      src="/brand/serahin-mark-yellow.png"
      width={256}
      height={256}
      className={`object-contain ${className}`}
      alt="Logo Serahin"
    />
  );
}

/** Ikon keranjang navigasi tetap fungsional dan berbeda dari brand mark. */
export function CartIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d="M3.5 4.5h2l1.6 9.1a1.7 1.7 0 0 0 1.7 1.4h8.8a1.7 1.7 0 0 0 1.6-1.2l1.3-5.2H6.2" />
      <path d="M9.2 18.7h.1M17.4 18.7h.1" strokeWidth="2.5" />
      <path d="M8.1 11.2h9.7" className="text-accent-500" />
    </svg>
  );
}

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
  layout?: "inline" | "stacked";
  href?: string;
  className?: string;
}) {
  const dims = {
    sm: { mark: "h-8 w-8", stackMark: "h-14 w-14", word: "h-5 w-auto", stackWord: "h-6 w-auto" },
    md: { mark: "h-10 w-10", stackMark: "h-16 w-16", word: "h-6 w-auto", stackWord: "h-7 w-auto" },
    lg: { mark: "h-12 w-12", stackMark: "h-24 w-24", word: "h-8 w-auto", stackWord: "h-9 w-auto" },
  }[size];

  const stacked = layout === "stacked";
  const wordmarkTone = tone === "onDark" ? "brightness-0 invert" : "";
  const taglineColor = tone === "onDark" ? "text-cream/80" : "text-sand-500";
  const tagline = withTagline && (
    <span className={`font-bold uppercase tracking-[0.14em] ${stacked ? "text-[0.62rem]" : "text-[0.55rem]"} ${taglineColor}`}>
      Pesan hari ini, terima dengan hati
    </span>
  );

  const wordmark = (wordClass: string) => (
    <Image
      src="/brand/serahin-wordmark.png"
      width={280}
      height={66}
      className={`object-contain object-left ${wordClass} ${wordmarkTone}`}
      alt=""
    />
  );

  const inner = stacked ? (
    <span className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <SerahinMark className={dims.stackMark} tone={tone} />
      {wordmark(dims.stackWord)}
      {tagline}
    </span>
  ) : (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <SerahinMark className={dims.mark} tone={tone} />
      <span className="inline-flex flex-col gap-1 text-left leading-none">
        {wordmark(dims.word)}
        {tagline}
      </span>
    </span>
  );

  return href ? <Link href={href} className="inline-flex">{inner}</Link> : inner;
}
