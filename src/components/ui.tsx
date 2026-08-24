import Link from "next/link";
import { ComponentProps, ReactNode } from "react";

// Kumpulan primitif UI ringan berbasis Tailwind — konsisten lintas modul.
// Palet & geometri mengikuti design system Serahin v1.9 (lihat globals.css).

type CardTone = "default" | "cream" | "brand";

const cardTones: Record<CardTone, string> = {
  default: "border-sand-200 bg-white",
  cream: "border-sand-200 bg-cream-soft",
  brand: "border-brand-200 bg-brand-50",
};

export function Card({
  children,
  className = "",
  tone = "default",
  ribbon = false,
}: {
  children: ReactNode;
  className?: string;
  /** Nuansa latar kartu. */
  tone?: CardTone;
  /** Pita gradien brand tipis di puncak kartu (untuk kartu penting). */
  ribbon?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow-sm ${cardTones[tone]} ${className}`}
    >
      {ribbon && (
        <span
          aria-hidden="true"
          className="bg-serahin-ribbon absolute inset-x-0 top-0 h-1"
        />
      )}
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  /** Ikon opsional dalam lingkaran brand di kiri judul. */
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-sand-200 px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-sand-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-sand-500">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "accent"
  | "sun";

// Catatan kontras (diverifikasi WCAG AA):
// • accent-500 (#F57223) hanya aman dengan teks GELAP → sand-900 (5.60).
// • sun-400 (#FFD600) idem → sand-900 (11.38).
// • Untuk teks putih di oranye, gunakan accent-600 (4.56).
const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-brand hover:bg-brand-700 active:bg-brand-800",
  secondary:
    "bg-white text-sand-700 ring-1 ring-inset ring-sand-300 hover:bg-sand-50 hover:ring-sand-400",
  danger: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800",
  ghost: "text-sand-600 hover:bg-sand-100 hover:text-sand-900",
  accent:
    "bg-accent-500 text-sand-900 shadow-accent hover:bg-accent-400 active:bg-accent-600 active:text-white",
  sun: "bg-sun-400 text-sand-900 hover:bg-sun-300 active:bg-sun-500",
};

const buttonBase =
  "inline-flex min-h-[2.25rem] items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:translate-y-0";

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function Button({
  variant = "primary",
  className = "",
  loading = false,
  disabled,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; loading?: boolean }) {
  return (
    <button
      disabled={disabled || loading}
      className={`${buttonBase} ${buttonStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  className = "",
  loading = false,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; loading?: boolean }) {
  return (
    <Link
      className={`${buttonBase} ${buttonStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </Link>
  );
}

// Tombol hapus berbentuk ikon — konsisten di tabel kampanye & vendor.
export function DeleteIconButton({
  onClick,
  loading = false,
  disabled = false,
  title = "Hapus",
  className = "",
}: {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      aria-label={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sand-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Spinner />
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      )}
    </button>
  );
}

export function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  /** Pesan galat di bawah input; menggantikan hint bila terisi. */
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-sand-700">
        {label}
        {required && <span className="text-accent-600"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-rose-700">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1 block text-xs text-sand-500">{hint}</span>
      )}
    </label>
  );
}

// Border pakai `border` asli (bukan `ring`/box-shadow) agar konsisten di Safari —
// Safari sering tidak merender inset box-shadow pada form control native, sehingga
// border input jadi tak terlihat.
const inputBase =
  "block w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-sm text-sand-900 transition placeholder:text-sand-400 hover:border-sand-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25";

export function Input(props: ComponentProps<"input">) {
  const { className = "", ...rest } = props;
  return <input className={`${inputBase} ${className}`} {...rest} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  const { className = "", ...rest } = props;
  return <textarea className={`${inputBase} ${className}`} {...rest} />;
}

export function Select(props: ComponentProps<"select">) {
  const { className = "", ...rest } = props;
  return <select className={`${inputBase} ${className}`} {...rest} />;
}

// Membungkus list panjang agar hanya menampilkan ~10 baris lalu bisa di-scroll.
// Dipakai konsisten di semua tempat yang menampilkan daftar.
export function ScrollList({
  children,
  className = "",
  maxRows = 10,
  rowHeight = 3.5,
}: {
  children: ReactNode;
  className?: string;
  /** Perkiraan jumlah baris yang terlihat sebelum scroll. */
  maxRows?: number;
  /** Perkiraan tinggi satu baris dalam rem. */
  rowHeight?: number;
}) {
  return (
    <div
      className={`overflow-y-auto overscroll-contain ${className}`}
      style={{ maxHeight: `${maxRows * rowHeight}rem` }}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-400 ring-1 ring-brand-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </span>
      <p className="text-sm font-bold text-sand-700">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-sand-500">{description}</p>
      )}
      {action}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 h-4 w-4 shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span className="min-w-0">{message}</span>
    </div>
  );
}

export function StatItem({
  label,
  value,
  accent = "text-sand-900",
}: {
  label: string;
  value: ReactNode;
  accent?: string;
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-sand-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-extrabold tracking-tight ${accent}`}>
        {value}
      </p>
    </div>
  );
}
