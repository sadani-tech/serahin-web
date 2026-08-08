import { auth } from "@/auth";

/** Ambil user aktif; lempar bila tidak ada sesi (dipakai di server action). */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Tidak terautentikasi");
  }
  return session.user;
}
