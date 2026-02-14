import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { User } from "@/lib/models/User";
import { sha256 } from "@/lib/tokens";

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);

    const email = String(body?.email || "").trim().toLowerCase();
    const token = String(body?.token || "").trim();

    if (!email || !token) return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });

    await connectMongo();

    const u = await User.findOne({ email });
    if (!u) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    if (u.emailVerifiedAt) return NextResponse.json({ ok: true });

    const tokenHash = sha256(token);
    const exp = u.emailVerifyTokenExpiresAt ? new Date(u.emailVerifyTokenExpiresAt).getTime() : 0;

    if (!u.emailVerifyTokenHash || u.emailVerifyTokenHash !== tokenHash)
        return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });

    if (!exp || Date.now() > exp) return NextResponse.json({ error: "TOKEN_EXPIRED" }, { status: 400 });

    u.emailVerifiedAt = new Date();
    u.emailVerifyTokenHash = "";
    u.emailVerifyTokenExpiresAt = null;
    await u.save();

    return NextResponse.json({ ok: true });
}
