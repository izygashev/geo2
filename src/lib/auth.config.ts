import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // authorize реализован в auth.ts (Node.js runtime)
      authorize: () => null,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const publicRoutes = ["/", "/sign-in", "/sign-up"];
      const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
      const isAuthApi = nextUrl.pathname.startsWith("/api/auth");
      const isReportsStartApi = nextUrl.pathname === "/api/reports/start";

      if (isPublicRoute || isAuthApi || isReportsStartApi) {
        return true;
      }

      if (!isLoggedIn) {
        return false; // Redirect to signIn page
      }

      return true;
    },
  },
};
