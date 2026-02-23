import { NextResponse } from "next/server";
import { getWidgetConfig } from "@/lib/widgetConfigStore";
import { connectMongo } from "@/lib/db";
import { KbChunk } from "@/lib/models/KbChunk";
import { Conversation } from "@/lib/models/Conversation";
import { generateSupportReplyGemini } from "@/services/responseGeneration/gemini";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

async function isDomainAllowed(appKey: string, parentOrigin: string) {
    const cfg = await getWidgetConfig(appKey);
    if (!cfg) return { ok: false, code: "INVALID_APP_KEY" as const };

    const host = parentOrigin ? new URL(parentOrigin).hostname : "";
    if (!host) return { ok: false, code: "MISSING_PARENT_ORIGIN" as const };

    if (!cfg.allowedDomains.includes(host)) {
        return {
            ok: false,
            code: "DOMAIN_NOT_ALLOWED" as const,
            host,
            allowed: cfg.allowedDomains,
        };
    }
    return { ok: true as const };
}

function expandQuery(userQuery: string): string {
    const q = userQuery.toLowerCase();

    const expansions: [RegExp, string][] = [
        // Location / stores
        [/locat|where|store|near|address|shop|branch|outlet|visit|in.person|walk.in/i,
            "store location address near city"],
        // Terms / legal
        [/terms|condition|policy|legal|rules|fine.print|agreement|tos/i,
            "terms conditions policy legal rules"],
        // Returns / refunds
        [/return|refund|exchange|money.back|cancel/i,
            "return refund policy 30 day restocking"],
        // Shipping / delivery
        [/ship|deliver|dispatch|track|transit|parcel|package/i,
            "shipping delivery days tracking order"],
        // Warranty / protection
        [/warrant|guarantee|protect|coverage|claim|broken|defect/i,
            "warranty guarantee protection plan claim"],
        // Payment
        [/pay|checkout|price|cost|bill|invoice|method|card/i,
            "payment methods price checkout card PayPal"],
        // Discounts / promotions
        [/discount|sale|offer|promo|coupon|deal|student|cheap/i,
            "discount sale promotion student seasonal"],
        // Support / contact
        [/support|help|contact|phone|email|chat|reach|talk|speak/i,
            "support contact phone email live chat"],
        // Trade-in
        [/trade.?in|sell|swap|exchange device|old device/i,
            "trade-in program device quote credit"],
        // Rewards / loyalty
        [/reward|point|loyal|tier|earn|redeem|bronze|silver|gold|platinum/i,
            "loyalty rewards points tier redeem"],
        // Recycling / sustainability
        [/recycl|e.?waste|sustain|eco|environment|old electronics|dispose/i,
            "recycling e-waste sustainability eco"],
        // Setup / installation
        [/setup|install|configur|how to use|start|unbox|first time/i,
            "setup installation guide steps configure"],
        // Troubleshooting
        [/not work|broken|issue|problem|slow|crash|fix|troubleshoot|error/i,
            "troubleshooting fix issue problem slow"],
        // Products
        [/laptop|computer|pc|macbook/i,
            "laptop computer desktop workstation"],
        [/phone|smartphone|iphone|android|samsung/i,
            "smartphone phone mobile device"],
        [/gaming|console|ps5|xbox|nintendo|playstation/i,
            "gaming console PlayStation Xbox Nintendo"],
        [/headphone|earbud|speaker|audio|sound/i,
            "audio headphones earbuds speaker"],
        [/smart home|alexa|google home|thermostat|security camera/i,
            "smart home device Alexa Google thermostat"],
    ];

    for (const [pattern, extra] of expansions) {
        if (pattern.test(q)) {
            return `${userQuery} ${extra}`;
        }
    }

    return userQuery;
}

// ─── Conversational query check ───────────────────────────────────────────────
// Skip KB search entirely for pure greetings / farewells / identity questions
// to avoid noise and save a DB round-trip.

function isConversationalQuery(query: string): boolean {
    const q = query.toLowerCase().trim();
    return (
        /^(hi|hello|hey|howdy|good\s+(morning|afternoon|evening|day)|sup|yo)\b/.test(q) ||
        /^(bye|goodbye|see\s+you|farewell|take\s+care|thanks?|thank\s+you|cheers|ok\s+thanks?|okay\s+thanks?|got\s+it|that'?s\s+(all|it)|no\s+(more\s+)?questions?)\b/.test(q) ||
        /(who\s+are\s+you|what\s+are\s+you|what\s+is\s+this|what\s+can\s+you\s+do|are\s+you\s+(a\s+)?(bot|ai|robot|human)|tell\s+me\s+about\s+yourself|how\s+do\s+you\s+work)/.test(q)
    );
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);

    const appKey = String(body?.appKey || "").trim();
    const parentOrigin = String(body?.parentOrigin || "").trim();
    const messages: IncomingMsg[] = Array.isArray(body?.messages) ? body.messages : [];
    let conversationId = String(body?.conversationId || "").trim();

    if (!appKey) return NextResponse.json({ error: "MISSING_APP_KEY" }, { status: 400 });
    if (!messages.length) return NextResponse.json({ error: "MISSING_MESSAGES" }, { status: 400 });

    const allowed = await isDomainAllowed(appKey, parentOrigin);
    if (!allowed.ok) return NextResponse.json({ error: allowed.code, ...allowed }, { status: 403 });

    await connectMongo();

    // ── Conversation management ──────────────────────────────────────────────

    if (conversationId) {
        const exists = await Conversation.exists({ _id: conversationId, appKey, isActive: true });
        if (!exists) conversationId = "";
    }

    if (!conversationId) {
        const welcome = {
            id: crypto.randomUUID(),
            role: "bot" as const,
            text: "Hi! I'm your support assistant.\nHow can I help you today?",
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

    // ── Extract latest user message ──────────────────────────────────────────

    const latestUser =
        (messages[messages.length - 1]?.role === "user" ? messages[messages.length - 1] : null) ||
        [...messages].reverse().find((m) => m.role === "user") ||
        null;

    const lastUserText = latestUser?.text?.trim() || "";

    if (!lastUserText) {
        return NextResponse.json({ error: "EMPTY_USER_MESSAGE" }, { status: 400 });
    }

    // ── KB search ────────────────────────────────────────────────────────────

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await embeddingModel.embedContent(lastUserText);
    const queryVector = result.embedding.values;

    const relevantDocs = await KbChunk.aggregate([
        {
            $vectorSearch: {
                index: "vector_index",
                path: "embedding",
                queryVector,
                numCandidates: 50,
                limit: 5,
                filter: { appKey },
            }
        },
        {
            $project: {
                title: 1, text: 1, sourceFile: 1,
                score: { $meta: "vectorSearchScore" }
            }
        },
        { $match: { score: { $gte: 0.7 } } }
    ]);

    // let relevantDocs: any[] = [];

    // if (!isConversationalQuery(lastUserText)) {
    //     const searchQuery = expandQuery(lastUserText);

    //     const kbDocs = await KbChunk.find(
    //         { appKey, $text: { $search: searchQuery } },
    //         { score: { $meta: "textScore" }, title: 1, text: 1, sourceFile: 1 }
    //     )
    //         .sort({ score: { $meta: "textScore" } })
    //         .limit(10)
    //         .lean();

    //     // Lower threshold (0.3) to catch semantically distant but relevant chunks.
    //     // Query expansion compensates for the lower bar by boosting truly relevant docs.
    //     relevantDocs = kbDocs.filter((d: any) => (d.score ?? 0) >= 0.3).slice(0, 5);
    // }

    // ── Recent history for context ───────────────────────────────────────────

    const recentHistory = messages
        .slice(0, -1)   // exclude the current user message (passed separately as userQuery)
        .slice(-8)
        .map((m) => ({ role: m.role, text: m.text }));

    // ── Generate AI reply ────────────────────────────────────────────────────

    const { reply } = await generateSupportReplyGemini({
        userQuery: lastUserText,
        kbDocs: relevantDocs,
        appKey,
        parentOrigin,
        recentHistory,
    });

    // ── Persist to DB ────────────────────────────────────────────────────────

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

    // ── Stream response via SSE ──────────────────────────────────────────────

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            controller.enqueue(
                encoder.encode(`event: start\ndata: ${JSON.stringify({ conversationId })}\n\n`)
            );

            const parts = reply.split(" ");
            for (let i = 0; i < parts.length; i++) {
                const token = parts[i] + (i === parts.length - 1 ? "" : " ");
                controller.enqueue(
                    encoder.encode(`event: token\ndata: ${JSON.stringify({ token })}\n\n`)
                );
                await new Promise((r) => setTimeout(r, 20));
            }

            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
            controller.close();
        },
    });

    return new Response(stream, { headers: sseHeaders() });
}