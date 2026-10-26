import { AuthForm } from "@/app/account/AuthForm";
import { AuthShell } from "@/app/account/AuthShell";
import { loginAction } from "@/lib/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/dashboard";

  return (
    <AuthShell title="Masuk ke Panel Admin" copy="Akses internal untuk mengelola dan mengawasi operasional platform Serahin.">
      <AuthForm
        action={loginAction}
        hidden={{ callbackUrl }}
        submit="Masuk"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "admin@serahin.id" },
          { name: "password", label: "Kata sandi", type: "password", autoComplete: "current-password" },
        ]}
      />
    </AuthShell>
  );
}
