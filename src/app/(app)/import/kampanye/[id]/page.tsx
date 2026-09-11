import { redirect } from "next/navigation";

export default async function LegacyPreorderImportRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/import/pre-orders/${id}`);
}
