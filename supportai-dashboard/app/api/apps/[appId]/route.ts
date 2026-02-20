import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectMongo } from "@/lib/db";
import { AppModel } from "@/lib/models/App";
import { parseDomains } from "@/lib/parseDomains";
import { KbChunk } from "@/lib/models/KbChunk";

function json(data: any, status = 200) {
    return NextResponse.json(data, { status });
}

export async function GET(_: Request, { params }: { params: Promise<{ appId: string }> }) {
    const session = await getServerSession(authOptions);
    const ownerId = (session?.user as any)?.mongoId;
    if (!ownerId) return json({ error: "UNAUTHORIZED" }, 401);

    await connectMongo();

    const app = await AppModel.findOne({ _id: (await params).appId, ownerId }).lean();
    if (!app) return json({ error: "NOT_FOUND" }, 404);

    const kb = await KbChunk.findOne({ appKey: app.appKey })
    const updatedApp = {
        ...app,
        kb: kb.text
    }

    return json({ app: updatedApp });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ appId: string }> }) {
    const session = await getServerSession(authOptions);
    const ownerId = (session?.user as any)?.mongoId;
    if (!ownerId) return json({ error: "UNAUTHORIZED" }, 401);

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "BAD_JSON" }, 400);

    await connectMongo();

    const update: any = { lastUpdatedAt: Date.now() };

    if (typeof body.name === "string") update.name = body.name.trim();

    if (body.allowedDomains !== undefined) {
        update.allowedDomains = parseDomains(body.allowedDomains);
    }

    // theme + copy
    if (body.theme && typeof body.theme === "object") {
        update["theme.primary"] = body.theme.primary;
        update["theme.background"] = body.theme.background;
        update["theme.panel"] = body.theme.panel;
        update["theme.text"] = body.theme.text;
    }

    if (body.copy && typeof body.copy === "object") {
        update["copy.title"] = body.copy.title;
        update["copy.subtitle"] = body.copy.subtitle;
        update["copy.placeholder"] = body.copy.placeholder;
    }

    if (typeof body.enableBorder === "boolean") update.enableBorder = body.enableBorder;
    if (typeof body.borderColor === "string") update.borderColor = body.borderColor;

    const app = await AppModel.findOneAndUpdate(
        { _id: (await params).appId, ownerId },
        { $set: update },
        { new: true }
    ).lean();

    if (!app) return json({ error: "NOT_FOUND" }, 404);

    return json({ app });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ appId: string }> }) {
    const session = await getServerSession(authOptions);
    const ownerId = (session?.user as any)?.mongoId;
    if (!ownerId) return json({ error: "UNAUTHORIZED" }, 401);

    await connectMongo();

    const app = await AppModel.findOneAndDelete({ _id: (await params).appId, ownerId }).lean();
    if (!app) return json({ error: "NOT_FOUND" }, 404);

    // optional: deleting KB chunks
    // await KbChunk.deleteMany({ appKey: app.appKey });

    return json({ ok: true });
}
