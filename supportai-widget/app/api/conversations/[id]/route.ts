import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";

export async function GET(_: Request, { params }: any) {
    await connectMongo();
    let { id } = await params;
    id = id.trim()

    if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

    const conv = await Conversation.findById(id).lean();
    if (!conv) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({
        conversationId: String(conv._id),
        appKey: conv.appKey,
        messages: conv.messages || [],
    });
}
