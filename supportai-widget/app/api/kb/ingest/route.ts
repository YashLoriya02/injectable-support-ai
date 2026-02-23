import { NextResponse } from "next/server";
import { getWidgetConfig } from "@/lib/widgetConfigStore";
import { chunkMarkdown } from "@/lib/kbChunker";
import { KbChunk } from "@/lib/models/KbChunk";
import { connectMongo } from "@/lib/db";

async function domainCheck(appKey: string, parentOrigin: string) {
    const cfg = await getWidgetConfig(appKey);
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
    const filename = String(body?.filename || "kb.md");
    const content = String(body?.content || "");

    if (!appKey) return NextResponse.json({ error: "MISSING_APP_KEY" }, { status: 400 });
    if (!content) return NextResponse.json({ error: "MISSING_CONTENT" }, { status: 400 });

    const chk = await domainCheck(appKey, parentOrigin);
    if (!chk.ok) return NextResponse.json(chk, { status: 403 });

    const chunks = chunkMarkdown(filename, content);

    await connectMongo();

    await KbChunk.deleteMany({ appKey, sourceFile: filename });

    await KbChunk.insertMany(
        chunks.map((c) => ({
            appKey,
            title: c.title,
            text: c.text,
            sourceFile: filename,
        }))
    );

    return NextResponse.json({ ok: true, chunksStored: chunks.length });
}
