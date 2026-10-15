import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { isBlocked } from "./auth-password";
import { z } from "zod";

class AccountBlocked extends CredentialsSignin {
  code = "blocked";
}

const passwordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  ticket: z.string().optional()
});
const ticketSchema = z.object({
  email: z.string().email(),
  ticket: z.string().min(10),
  password: z.string().optional()
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        ticket: { label: "Ticket", type: "text" }
      },
      async authorize(raw) {
        const ticketParsed = ticketSchema.safeParse(raw);
        if (ticketParsed.success && ticketParsed.data.ticket) {
          const { verifyAuthTicket } = await import("./auth-ticket");
          const email = ticketParsed.data.email.toLowerCase().trim();
          const userId = verifyAuthTicket(ticketParsed.data.ticket);
          if (!userId) return null;
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (!user || user.email !== email) return null;
          if (isBlocked(user)) throw new AccountBlocked();
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            locale: user.locale
          };
        }
        const parsed = passwordSchema.safeParse(raw);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.passwordHash.length < 20) return null;
        if (isBlocked(user)) throw new AccountBlocked();
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          locale: user.locale
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.role = (user as { role?: string }).role ?? "user";
        token.locale = (user as { locale?: string }).locale ?? "ru";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.role = (token.role as string) ?? "user";
        session.user.locale = (token.locale as string) ?? "ru";
      }
      return session;
    }
  }
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || isBlocked(user)) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    locale: user.locale
  };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user || user.role !== "admin") return null;
  return user;
}
