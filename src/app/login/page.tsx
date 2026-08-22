import { SerahinLogo } from "@/components/brand";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/";

  return (
    <div className="bg-serahin-dots relative flex min-h-full flex-1 items-center justify-center px-4 py-12">
      {/* Sorotan sinar matahari di balik kartu — motif dari lambang Serahin. */}
      <div
        aria-hidden="true"
        className="bg-serahin-sunburst pointer-events-none absolute inset-x-0 top-0 h-80"
      />

      <div className="relative w-full max-w-sm animate-rise">
        <div className="mb-7 flex flex-col items-center text-center">
          <SerahinLogo size="lg" layout="stacked" withTagline />
        </div>

        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-lg">
          <div aria-hidden="true" className="bg-serahin-ribbon h-1.5 w-full" />
          <div className="p-6">
            <h1 className="text-lg font-extrabold tracking-tight text-sand-900">
              Masuk ke panel admin
            </h1>
            <p className="mt-1 mb-5 text-sm text-sand-500">
              Kelola kampanye, pesanan, dan pembayaran Anda.
            </p>
            <LoginForm callbackUrl={callbackUrl} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-sand-500">
          Akses khusus Admin/Penjual.
        </p>
      </div>
    </div>
  );
}
