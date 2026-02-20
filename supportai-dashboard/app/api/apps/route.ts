import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { AppModel } from "@/lib/models/App";
import { requireSession } from "@/lib/auth";
import { KbChunk } from "@/lib/models/KbChunk";

function genAppKey() {
    return "app_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

function normalizeDomains(input: any): string[] {
    if (!input) return [];
    const raw =
        Array.isArray(input) ? input.join(",") : String(input);

    const parts = raw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

    const cleaned = parts
        .map((d) => d.replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
        .filter(Boolean);

    return Array.from(new Set(cleaned));
}

export async function GET() {
    const ses = await requireSession();
    if (!ses.ok) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    await connectMongo();

    const apps = await AppModel.find({ ownerId: ses.userId })
        .sort({ createdAt: -1 })
        .select({ name: 1, appKey: 1, allowedDomains: 1, createdAt: 1, updatedAt: 1 })
        .lean();

    return NextResponse.json({ apps });
}

export async function POST(req: Request) {
    const ses = await requireSession();
    if (!ses.ok) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const body = await req.json().catch(() => null);

    const name = String(body?.name || "").trim();
    const allowedDomains = normalizeDomains(body?.allowedDomains);
    const markdownRaw = String(body?.markdownRaw || "").trim();

    if (!name) return NextResponse.json({ error: "MISSING_NAME" }, { status: 400 });

    await connectMongo();

    let appKey = genAppKey();
    for (let i = 0; i < 3; i++) {
        const exists = await AppModel.exists({ appKey });
        if (!exists) break;
        appKey = genAppKey();
    }

    const created = await AppModel.create({
        ownerId: ses.userId,
        name,
        appKey,
        allowedDomains,
    });

    if (markdownRaw) {
        await KbChunk.deleteMany({ appKey });

        await KbChunk.insertOne({
            appKey,
            title: name,
            text: markdownRaw
        });
    }

    return NextResponse.json({
        appId: String(created._id),
        name: created.name,
        appKey: created.appKey,
        allowedDomains: created.allowedDomains,
    });
}
