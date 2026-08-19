import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema/auth";
import { eq, or } from "drizzle-orm";
import authConfig from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const identifier = credentials.identifier as string;
        const password = credentials.password as string;

        // Find user by email or username
        const [user] = await db
          .select()
          .from(users)
          .where(
            or(
              eq(users.email, identifier.toLowerCase().trim()),
              eq(users.username, identifier.trim())
            )
          )
          .limit(1);

        if (!user || !user.password_hash) {
          return null;
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.full_name || user.username || user.name,
          image: user.avatar_url || user.image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        const now = new Date();
        const today = now.toISOString().split("T")[0];
        try {
          await db
            .update(users)
            .set({
              last_login: now,
              last_login_date: today,
              updated_at: now,
            })
            .where(eq(users.id, user.id));
        } catch (e) {
          console.error("Failed to update last_login on signIn event:", e);
        }
      }
    },
  },
  pages: {
    signIn: "/login",
  },
});
