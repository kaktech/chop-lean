import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  // Google only returns verified emails, so linking to an existing email-code account is safe.
  providers: [Google({ allowDangerousEmailAccountLinking: true })],
  pages: { signIn: "/signin" },
  callbacks: {
    // Return only what the app needs. The default hands the browser the whole user row (including the password hash)
    // and the session token, which must never reach client-side JavaScript.
    session({ session, user }) {
      return {
        expires: session.expires,
        user: { id: user.id, name: user.name ?? null, email: user.email, image: user.image ?? null },
      } as typeof session;
    },
  },
});

export const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isAdminEmail = (email?: string | null) =>
  !!email && adminEmails().includes(email.toLowerCase());
