import { api } from "@/lib/api";
import { PromotionsManager, type Promotion, type EligibleEvent } from "./PromotionsManager";

export const dynamic = "force-dynamic";

export default async function SellerPromotionsPage() {
  const [promotions, events] = await Promise.all([
    api.get<Promotion[]>("/seller/promotions"),
    api.get<EligibleEvent[]>("/seller/promotions/eligible-events"),
  ]);
  return <PromotionsManager promotions={promotions} events={events} />;
}
