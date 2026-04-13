import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Sign-in brute-force protection — dual layer:
// 1) Per-email: 5 attempts per 60s (prevents single-account brute-force)
// 2) Per-IP:   20 attempts per 300s (prevents credential-stuffing / spraying)
const SIGN_IN_EMAIL_LIMIT = { maxRequests: 5, windowSeconds: 60 };
const SIGN_IN_IP_LIMIT = { maxRequests: 20, windowSeconds: 300 };

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        // --- IP-based rate limit (credential-stuffing protection) ---
        let clientIp = "unknown";
        try {
          const hdrs = await headers();
          clientIp = getClientIp(hdrs);
        } catch {
          // headers() may fail outside request context
        }
        const ipRl = checkRateLimit(`signin-ip:${clientIp}`, SIGN_IN_IP_LIMIT);
        if (!ipRl.allowed) {
          throw new Error("Слишком много попыток входа с вашего адреса. Подождите 5 минут.");
        }

        // --- Per-email rate limit (single-account brute-force protection) ---
        const emailRl = checkRateLimit(`signin:${email}`, SIGN_IN_EMAIL_LIMIT);
        if (!emailRl.allowed) {
          throw new Error("Слишком много попыток входа. Подождите минуту.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Constant-time comparison to prevent user enumeration via timing
          await bcrypt.hash(password, 12);
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
});
