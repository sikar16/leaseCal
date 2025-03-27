import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<{ id: string; email: string; name?: string | null } | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }
      
        const user = await db.user.findUnique({
          where: { email: credentials.email }
        });
      
        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }
      
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
      
        if (!isValid) {
          throw new Error("Invalid credentials");
        }
      
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name || null
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }): Promise<{ id: string; name?: string | null; email?: string | null }> {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }): Promise<{
      user: {
        id: string;
        name?: string | null;
        email?: string | null;
      };
      expires: string;
    }> {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};