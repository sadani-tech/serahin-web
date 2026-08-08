import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { SessionUser } from "@/lib/types";
import { TOKEN_COOKIE } from "@/lib/api";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret",
);

/** Baca & verifikasi JWT dari cookie; null bila tidak ada / invalid. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: (payload.role as SessionUser["role"]) ?? "ADMIN",
    };
  } catch {
    return null;
  }
}

/** Ambil user aktif; lempar bila tidak ada sesi (dipakai di server action). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new Error("Tidak terautentikasi");
  return user;
}
