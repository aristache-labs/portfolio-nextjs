import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { dbForAdapter } from "@/db/client";
import { authUsers, authAccounts, authSessions, authVerificationTokens } from "@/db/schema";
import { isAllowedLogin } from "@/lib/auth-callbacks";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Derive the OAuth redirect_uri from the request host so a single GitHub
  // OAuth app works across environments: localhost in dev, the production
  // origin in prod. Without this, a self-hosted prod deploy throws UntrustedHost.
  trustHost: true,
  adapter: DrizzleAdapter(dbForAdapter, {
    usersTable: authUsers,
    accountsTable: authAccounts,
    sessionsTable: authSessions,
    verificationTokensTable: authVerificationTokens,
  }),
  session: { strategy: "jwt" },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    // GitHub profile exposes `login`; reject anyone but the admin.
    async signIn({ profile }) {
      const login = (profile as { login?: string } | undefined)?.login;
      return isAllowedLogin(login, process.env.ADMIN_GITHUB_LOGIN);
    },
    // Keep the GitHub login on the token and the session, so server code can check it against the
    // admin login again instead of trusting that any session is the admin's.
    async jwt({ token, profile }) {
      const login = (profile as { login?: string } | undefined)?.login;
      if (login) token.login = login;
      return token;
    },
    async session({ session, token }) {
      session.user.login = token.login;
      return session;
    },
  },
  pages: { signIn: "/login" },
});
