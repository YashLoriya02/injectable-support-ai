import { requireSession } from "@/lib/auth";
import { connectMongo } from "@/lib/db";
import { KbChunk } from "@/lib/models/KbChunk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const ses = await requireSession();
    if (!ses.ok) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const body = await req.json().catch(() => null);

    const appKey = String(body?.appKey || "").trim();
    const markdownRaw = String(body?.content || "").trim();
    const sourceFile = String(body?.mdFileName || "").trim();

    if (!appKey) return NextResponse.json({ error: "MISSING_APPKEY" }, { status: 400 });
    if (!markdownRaw) return NextResponse.json({ error: "MISSING_NAME" }, { status: 400 });

    await connectMongo();

    if (markdownRaw) {
        await KbChunk.updateOne({ appKey }, { text: markdownRaw, sourceFile });
    }

    return NextResponse.json({
        message : "SUCCESS"
    });
}