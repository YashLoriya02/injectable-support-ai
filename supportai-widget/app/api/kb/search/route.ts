import { NextResponse } from "next/server";
import { getWidgetConfig } from "@/lib/widgetConfigStore";
import { connectMongo } from "@/lib/db";
import { KbChunk } from "@/lib/models/KbChunk";

function domainCheck(appKey: string, parentOrigin: string) {
    const cfg = getWidgetConfig(appKey);
    if (!cfg) return { ok: false, error: "INVALID_APP_KEY" as const };
    const host = parentOrigin ? new URL(parentOrigin).hostname : "";
    if (!host) return { ok: false, error: "MISSING_PARENT_ORIGIN" as const };
    if (!cfg.allowedDomains.includes(host))
        return { ok: false, error: "DOMAIN_NOT_ALLOWED" as const, host, allowedDomains: cfg.allowedDomains };
    return { ok: true as const };
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);

    const appKey = String(body?.appKey || "").trim();
    const parentOrigin = String(body?.parentOrigin || "").trim();
    const query = String(body?.query || "").trim();

    if (!appKey) return NextResponse.json({ error: "MISSING_APP_KEY" }, { status: 400 });
    if (!query) return NextResponse.json({ error: "MISSING_QUERY" }, { status: 400 });

    const chk = domainCheck(appKey, parentOrigin);
    if (!chk.ok) return NextResponse.json(chk, { status: 403 });

    await connectMongo();

    const docs = await KbChunk.find(
        { appKey, $text: { $search: query } },
        { score: { $meta: "textScore" }, title: 1, text: 1, sourceFile: 1 }
    )
        .sort({ score: { $meta: "textScore" } })
        .limit(5)
        .lean();

    const chunks = docs.map((d: any) => ({
        id: String(d._id),
        title: d.title,
        text: d.text,
        sourceFile: d.sourceFile,
        score: d.score,
    }));

    return NextResponse.json({ chunks });
}
