import type { NextAuthConfig } from "next-auth";

/**
 * Konfigurasi auth yang aman untuk Edge runtime (dipakai di middleware).
 * TIDAK boleh mengimpor Prisma / bcrypt di sini — providers dengan akses DB
 * ditambahkan di src/auth.ts yang hanya berjalan di Node runtime.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
