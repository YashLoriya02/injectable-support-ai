import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectMongo } from "@/lib/db";
import { User } from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,

    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = String(credentials?.email || "").trim().toLowerCase();
                const password = String(credentials?.password || "");
                if (!email || !password) throw new Error("MISSING_CREDENTIALS");

                await connectMongo();
                const user = await User.findOne({ email });
                if (!user) throw new Error("INVALID_CREDENTIALS");
                if (!user.passwordHash) throw new Error("USE_GOOGLE_LOGIN");

                const ok = await bcrypt.compare(password, user.passwordHash);
                if (!ok) throw new Error("INVALID_CREDENTIALS");
                if (!user.emailVerifiedAt) throw new Error("EMAIL_NOT_VERIFIED");

                return {
                    id: String(user._id), // note: this is NEXTAUTH "user.id"
                    name: user.name || "",
                    email: user.email,
                };
            },
        }),
    ],

    callbacks: {
        async signIn({ account, user }) {
            if (account?.provider !== "google") return true;
            return Boolean(user?.email);
        },

        async jwt({ token, user, account }) {
            // already have mongo userId
            if ((token as any).userId) return token;

            const email = String(user?.email || token?.email || "").toLowerCase();
            if (!email) return token;

            await connectMongo();

            // first Google sign-in: upsert + store mongoId in token
            if (account?.provider === "google") {
                const dbUser = await User.findOneAndUpdate(
                    { email },
                    {
                        $set: {
                            name: user?.name || "",
                            email,
                            provider: "google",
                            emailVerifiedAt: new Date(),
                            emailVerifyTokenHash: "",
                            emailVerifyTokenExpiresAt: null,
                        },
                        $setOnInsert: { passwordHash: "" },
                    },
                    { new: true, upsert: true }
                ).select("_id");

                (token as any).userId = String(dbUser._id);
                return token;
            }

            // credentials / later calls
            const dbUser = await User.findOne({ email }).select("_id").lean();
            if (dbUser?._id) (token as any).userId = String(dbUser._id);

            return token;
        },

        async session({ session, token }) {
            const mongoId = String((token as any).userId || "");

            // put mongoId where you actually read it
            if (session.user) {
                (session.user as any).mongoId = mongoId;
                (session.user as any).id = mongoId; // optional but useful
            }

            return session;
        },
    },

    pages: { signIn: "/login" },
};


export async function requireSession() {
    const session = await getServerSession(authOptions);

    const userId = (session as any)?.user?.mongoId;

    if (!session || !userId) {
        return { ok: false as const, session: null, userId: "" };
    }

    return { ok: true as const, session, userId: String(userId) };
}