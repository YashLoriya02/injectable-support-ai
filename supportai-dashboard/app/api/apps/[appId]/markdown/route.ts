import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { AppModel } from "@/lib/models/App";

export async function POST(req: Request, { params }: { params: Promise<{ appId: string }> }) {
    const appId = (await params).appId

    const ses = await requireSession();
    if (!ses.ok) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "MISSING_FILE" }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".md")) {
        return NextResponse.json({ error: "ONLY_MD_ALLOWED" }, { status: 400 });
    }

    const text = await file.text();

    await connectMongo();

    const updated = await AppModel.findOneAndUpdate(
        { _id: appId, ownerId: ses.userId },
        { $set: { markdownRaw: text } },
        { new: true }
    ).lean();

    if (!updated) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({ ok: true, size: text.length });
}
