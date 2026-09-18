import Image from "next/image";

export function SerahinMark({ className = "brand-mark" }: { className?: string }) {
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

export function SerahinLogo({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand-logo${light ? " brand-logo--light" : ""}`}>
      <SerahinMark />
      <Image
        src="/brand/serahin-wordmark.png"
        width={168}
        height={40}
        className={`brand-wordmark${light ? " brand-wordmark--light" : ""}`}
        alt=""
      />
    </span>
  );
}
