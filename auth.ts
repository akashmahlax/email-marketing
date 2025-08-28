import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "@/lib/db";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_URL; // fallback for minimal dev

if (!googleClientId || !googleClientSecret) {
  console.warn('Missing Google OAuth credentials: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env. Sign-in will fail without them.');
}

if (!nextAuthSecret) {
  console.warn('Missing NEXTAUTH_SECRET; it is recommended to set one for production.');
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(client),
  providers: [
    GoogleProvider({
      clientId: googleClientId || '',
      clientSecret: googleClientSecret || '',
    }),
  ],
  secret: nextAuthSecret,
});