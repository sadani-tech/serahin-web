import { redirect } from "next/navigation";

type SearchValue = string | string[] | undefined;

export default async function LegacyCampaignRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, SearchValue>>;
}) {
  const [{ slug = [] }, query] = await Promise.all([params, searchParams]);
  const target = new URL(`/pre-orders/${slug.join("/")}`, "http://localhost");

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) value.forEach((item) => target.searchParams.append(key, item));
    else if (value !== undefined) target.searchParams.set(key, value);
  }

  redirect(`${target.pathname}${target.search}`);
}
