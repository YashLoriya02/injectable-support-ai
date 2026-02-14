import { NextResponse } from "next/server";
import { getWidgetConfig } from "@/lib/widgetConfigStore";
import { connectMongo } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";

function isDomainAllowed(appKey: string, parentOrigin: string) {
    const cfg = getWidgetConfig(appKey);
    if (!cfg) return { ok: false, code: "INVALID_APP_KEY" as const };

    const host = parentOrigin ? new URL(parentOrigin).hostname : "";
    if (!host) return { ok: false, code: "MISSING_PARENT_ORIGIN" as const };

    if (!cfg.allowedDomains.includes(host)) {
        return { ok: false, code: "DOMAIN_NOT_ALLOWED" as const, host, allowed: cfg.allowedDomains };
    }
    return { ok: true as const };
}

function welcomeMessage() {
    return {
        id: crypto.randomUUID(),
        role: "bot" as const,
        text: "Hi! I'm your support assistant. \nHow can I help you today ?",
        ts: Date.now(),
    };
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);

    const appKey = String(body?.appKey || "").trim();
    const parentOrigin = String(body?.parentOrigin || "").trim();
    const currentConversationId = String(body?.currentConversationId || "").trim();

    if (!appKey) return NextResponse.json({ error: "MISSING_APP_KEY" }, { status: 400 });

    const allowed = isDomainAllowed(appKey, parentOrigin);
    if (!allowed.ok) return NextResponse.json({ error: allowed.code, ...allowed }, { status: 403 });

    await connectMongo();

    if (currentConversationId) {
        await Conversation.updateOne(
            { _id: currentConversationId, appKey, isActive: true },
            { $set: { isActive: false, lastActivityAt: Date.now() } }
        ).catch(() => { });
    }

    const created = await Conversation.create({
        appKey,
        parentOrigin,
        isActive: true,
        lastActivityAt: Date.now(),
        messages: [welcomeMessage()],
    });

    return NextResponse.json({ conversationId: String(created._id) }, { status: 200 });
}
