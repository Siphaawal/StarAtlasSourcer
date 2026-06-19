import NextAuth, { type DefaultSession } from "next-auth";
import Discord from "next-auth/providers/discord";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// Augment the session/user types with our app fields.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      points: number;
      username?: string | null;
    } & DefaultSession["user"];
  }
}

const devLoginEnabled = process.env.ENABLE_DEV_LOGIN === "true";
const discordConfigured = !!process.env.AUTH_DISCORD_ID && !!process.env.AUTH_DISCORD_SECRET;

const providers = [];

if (discordConfigured) {
  providers.push(
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    })
  );
}

if (devLoginEnabled) {
  // Local-only bypass: log in as any username/role without Discord.
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev Login",
      credentials: {
        username: { label: "Username", type: "text" },
        role: { label: "Role", type: "text" },
      },
      async authorize(creds) {
        const username = String(creds?.username || "").trim() || "DevUser";
        const requested = String(creds?.role || "MEMBER").toUpperCase();
        const role = (Object.values(Role) as string[]).includes(requested)
          ? (requested as Role)
          : Role.MEMBER;
        const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@dev.local`;

        const user = await prisma.user.upsert({
          where: { email },
          update: { role },
          create: { email, name: username, username, role },
        });
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  // Credentials requires JWT sessions; OAuth works fine with JWT too.
  session: { strategy: "jwt" },
  providers,
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        // Always read fresh role/points from the DB.
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.role = dbUser.role;
          session.user.points = dbUser.points;
          session.user.username = dbUser.username;
          session.user.name = dbUser.name;
          session.user.image = dbUser.image;
        }
      }
      return session;
    },
  },
});

export const config = { devLoginEnabled, discordConfigured };
