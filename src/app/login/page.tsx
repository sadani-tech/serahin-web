import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Button, Field, FormError, Input } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/";

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const target = String(formData.get("callbackUrl") ?? "/");

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: target,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect(`/login?error=1&callbackUrl=${encodeURIComponent(target)}`);
      }
      throw error;
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Serahin
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sistem Manajemen Pre-Order — Panel Admin
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <form action={login} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />

            {params.error && (
              <FormError message="Email atau password salah." />
            )}

            <Field label="Email" required>
              <Input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@serahin.id"
              />
            </Field>

            <Field label="Password" required>
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
            </Field>

            <Button type="submit" className="w-full">
              Masuk
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Akses khusus Admin/Penjual.
        </p>
      </div>
    </div>
  );
}
