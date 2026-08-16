import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export default {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/admin") ||
        nextUrl.pathname.startsWith("/cbt") ||
        nextUrl.pathname.startsWith("/studzyai");

      if (isOnProtected) {
        if (isLoggedIn) return true;
        return false; // Redirects unauthenticated users to login
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
