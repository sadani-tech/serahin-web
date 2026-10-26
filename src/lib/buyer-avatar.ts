import { api, ApiError } from "@/lib/api";
import type { SessionUser } from "@/lib/types";

/**
 * Avatar Buyer (v2.3.7 FR-37.40) tidak disimpan di JWT session — session
 * cookie sengaja tetap minimal (name/email/role) supaya tidak perlu re-login
 * tiap kali avatar diganti. Halaman yang menampilkan `ProfileMenu` untuk
 * Buyer memanggil ini secara terpisah untuk dapat `avatarUrl` terbaru.
 */
export async function getBuyerAvatarUrl(session: SessionUser | null): Promise<string | null> {
  if (session?.role !== "BUYER") return null;
  try {
    const profile = await api.get<{ avatarUrl: string | null }>("/auth/buyer/profile");
    return profile.avatarUrl;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    return null;
  }
}
