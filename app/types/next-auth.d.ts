import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extend the default session type
   */
  interface Session {
    user: {
      role?: string;
    } & DefaultSession["user"];
    accessToken?: string;
  }

  /**
   * Extend the default user type
   */
  interface User extends DefaultUser {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extend the default token type
   */
  interface JWT {
    role?: string;
    accessToken?: string;
  }
} 