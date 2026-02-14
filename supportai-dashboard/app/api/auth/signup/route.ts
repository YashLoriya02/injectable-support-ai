import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongo } from "@/lib/db";
import { User } from "@/lib/models/User";
import { makeVerifyToken, sha256 } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mailer";

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);

    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email) return NextResponse.json({ error: "MISSING_EMAIL" }, { status: 400 });
    if (!password || password.length < 6)
        return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });

    await connectMongo();

    const existing = await User.findOne({ email }).lean();
    if (existing) return NextResponse.json({ error: "EMAIL_ALREADY_EXISTS" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);

    const token = makeVerifyToken();
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min

    await User.create({
        name,
        email,
        passwordHash,
        provider: "credentials",
        emailVerifiedAt: null,
        emailVerifyTokenHash: tokenHash,
        emailVerifyTokenExpiresAt: expiresAt,
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    await sendVerificationEmail({ to: email, name, verifyUrl });

    return NextResponse.json({ ok: true });
}
