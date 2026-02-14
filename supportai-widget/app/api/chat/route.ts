import { NextResponse } from "next/server";
import { getWidgetConfig } from "@/lib/widgetConfigStore";
import { connectMongo } from "@/lib/db";
import { KbChunk } from "@/lib/models/KbChunk";
import { Conversation } from "@/lib/models/Conversation";

type IncomingMsg = {
    id?: string;
    role: "user" | "bot";
    text: string;
    ts?: number;
};

function sseHeaders() {
    return {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
    };
}

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

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);

    const appKey = String(body?.appKey || "").trim();
    const parentOrigin = String(body?.parentOrigin || "").trim();
    const messages: IncomingMsg[] = Array.isArray(body?.messages) ? body.messages : [];
    let conversationId = String(body?.conversationId || "").trim();

    if (!appKey) return NextResponse.json({ error: "MISSING_APP_KEY" }, { status: 400 });
    if (!messages.length) return NextResponse.json({ error: "MISSING_MESSAGES" }, { status: 400 });

    const allowed = isDomainAllowed(appKey, parentOrigin);
    if (!allowed.ok) return NextResponse.json({ error: allowed.code, ...allowed }, { status: 403 });

    await connectMongo();

    if (conversationId) {
        const exists = await Conversation.exists({ _id: conversationId, appKey, isActive: true });
        if (!exists) conversationId = "";
    }

    if (!conversationId) {
        const welcome = {
            id: crypto.randomUUID(),
            role: "bot" as const,
            text: "Hi! I'm your support assistant. \nHow can I help you today ?",
            ts: Date.now(),
        };

        const created = await Conversation.create({
            appKey,
            parentOrigin,
            isActive: true,
            lastActivityAt: Date.now(),
            messages: [welcome],
        });

        conversationId = String(created._id);
    }

    // latest user msg
    const latestUser =
        (messages.length && messages[messages.length - 1]?.role === "user" ? messages[messages.length - 1] : null) ||
        [...messages].reverse().find((m) => m.role === "user") ||
        null;

    const lastUserText = latestUser?.text?.trim() || "your message";

    // KB search
    const kbDocs = await KbChunk.find(
        { appKey, $text: { $search: lastUserText } },
        { score: { $meta: "textScore" }, title: 1, text: 1, sourceFile: 1 }
    )
        .sort({ score: { $meta: "textScore" } })
        .limit(5)
        .lean();

    const context =
        kbDocs.length > 0
            ? kbDocs.map((c: any, i: number) => `Source ${i + 1}: ${c.title}\n${c.text}`).join("\n\n")
            : "";

    const reply =
        kbDocs.length > 0
            ? `Here's what I found in your docs:\n\n${context}\n\nIf you want, tell me what part to clarify.`
            : `No relevant docs found yet. Upload Markdown to improve answers.\n\nTell me what you’re trying to do and I’ll guide you.`;

    const userToSave = latestUser
        ? {
            id: String(latestUser.id || crypto.randomUUID()),
            role: "user" as const,
            text: String(latestUser.text || ""),
            ts: Number(latestUser.ts || Date.now()),
        }
        : null;

    const botToSave = {
        id: crypto.randomUUID(),
        role: "bot" as const,
        text: reply,
        ts: Date.now(),
    };

    await Conversation.updateOne(
        { _id: conversationId, appKey, isActive: true },
        {
            $push: { messages: { $each: [...(userToSave ? [userToSave] : []), botToSave] } },
            $set: { lastActivityAt: Date.now(), parentOrigin },
        }
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            controller.enqueue(
                encoder.encode(`event: start\ndata: ${JSON.stringify({ conversationId })}\n\n`)
            );

            const parts = reply.split(" ");
            for (let i = 0; i < parts.length; i++) {
                const token = parts[i] + (i === parts.length - 1 ? "" : " ");
                controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ token })}\n\n`));
                await new Promise((r) => setTimeout(r, 25));
            }

            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
            controller.close();
        },
    });

    return new Response(stream, { headers: sseHeaders() });
}
