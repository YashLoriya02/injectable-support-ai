// import NextAuth from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import CredentialsProvider from "next-auth/providers/credentials";
// import bcrypt from "bcryptjs";
// import { connectMongo } from "@/lib/db";
// import { User } from "@/lib/models/User";

// const handler = NextAuth({
//     session: { strategy: "jwt" },
//     secret: process.env.NEXTAUTH_SECRET,

//     providers: [
//         GoogleProvider({
//             clientId: process.env.GOOGLE_CLIENT_ID!,
//             clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//         }),

//         CredentialsProvider({
//             name: "Credentials",
//             credentials: {
//                 email: { label: "Email", type: "text" },
//                 password: { label: "Password", type: "password" },
//             },
//             async authorize(credentials) {
//                 const email = String(credentials?.email || "").trim().toLowerCase();
//                 const password = String(credentials?.password || "");
//                 if (!email || !password) throw new Error("MISSING_CREDENTIALS");

//                 await connectMongo();
//                 const user = await User.findOne({ email });
//                 if (!user) throw new Error("INVALID_CREDENTIALS");
//                 if (!user.passwordHash) throw new Error("USE_GOOGLE_LOGIN");

//                 const ok = await bcrypt.compare(password, user.passwordHash);
//                 if (!ok) throw new Error("INVALID_CREDENTIALS");
//                 if (!user.emailVerifiedAt) throw new Error("EMAIL_NOT_VERIFIED");

//                 return {
//                     id: String(user._id),
//                     name: user.name || "",
//                     email: user.email,
//                 };
//             },
//         }),
//     ],

//     callbacks: {
//         async signIn({ account, user }) {
//             // allow both providers
//             if (account?.provider !== "google") return true;
//             // we’ll upsert in jwt() so nothing needed here
//             return Boolean(user?.email);
//         },

//         async jwt({ token, user, account }) {
//             // If already set, keep it
//             if ((token as any).userId) return token;

//             const email = String(user?.email || token?.email || "").toLowerCase();
//             if (!email) return token;

//             await connectMongo();

//             if (account?.provider === "google") {
//                 const dbUser = await User.findOneAndUpdate(
//                     { email },
//                     {
//                         $set: {
//                             name: user?.name || "",
//                             email,
//                             provider: "google",
//                             emailVerifiedAt: new Date(),
//                             emailVerifyTokenHash: "",
//                             emailVerifyTokenExpiresAt: null,
//                         },
//                         $setOnInsert: {
//                             passwordHash: "",
//                         },
//                     },
//                     { new: true, upsert: true }
//                 ).select("_id");

//                 console.log("DB USER: ", dbUser);

//                 (token as any).userId = String(dbUser._id);

//                 return token;
//             }

//             const dbUser = await User.findOne({ email }).select("_id").lean();
//             if (dbUser?._id) (token as any).userId = String(dbUser._id);

//             return token;
//         },

//         async session({ session, token }) {
//             const mongoId = String((token as any).userId || "");

//             if (session.user) {
//                 (session.user as any).id = mongoId;
//                 (session.user as any).mongoId = mongoId;
//             } else {
//                 (session as any).user = { id: mongoId, mongoId };
//             }

//             return session;
//         },
//     },

//     pages: { signIn: "/login" },
// });

// export { handler as GET, handler as POST };


import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
