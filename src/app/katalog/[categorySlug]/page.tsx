import { redirect } from "next/navigation";

type Params = Promise<{ categorySlug: string }>;

/** Compatibility route. The canonical public catalog path is /catalog. */
export default async function LegacyCategoryPage({ params }: { params: Params }) {
  const { categorySlug } = await params;
  redirect(`/catalog/${categorySlug}`);
}
