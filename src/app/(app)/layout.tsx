import { getSession } from "@/lib/session";
import { AppShell } from "./AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <AppShell user={session ? { name: session.name, email: session.email } : null}>
      {children}
    </AppShell>
  );
}
