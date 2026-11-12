import type { DefaultSession } from "next-auth";

// The GitHub login is stored on the token and the session at sign-in (see src/auth.ts).
declare module "next-auth" {
  interface Session {
    user: { login?: string } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    login?: string;
  }
}
