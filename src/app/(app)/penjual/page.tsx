import { api } from "@/lib/api";
import SellersDirectory from "./SellersDirectory";
import { PhoneChangeRequests, type PhoneChangeRequest } from "./PhoneChangeRequests";

export const dynamic = "force-dynamic";

export default async function SellersPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string; page?: string; limit?: string; sort?: string; order?: string }> }) {
  const requests = await api.get<PhoneChangeRequest[]>("/sellers/phone-change-requests");
  return <div className="space-y-6">{requests.length > 0 && <PhoneChangeRequests requests={requests}/>}<SellersDirectory searchParams={searchParams}/></div>;
}
