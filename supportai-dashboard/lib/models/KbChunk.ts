import { Schema, model, models } from "mongoose";

const KbChunkSchema = new Schema(
    {
        appKey: { type: String, required: true, index: true },
        title: { type: String, default: "" },
        text: { type: String, required: true },
        embedding: { type: [Number], default: [] },
        sourceFile: { type: String, default: "" },
        createdAtMs: { type: Number, default: () => Date.now() },
    },
    { timestamps: true }
);

KbChunkSchema.index({ title: "text", text: "text" });

export const KbChunk = models.KbChunk || model("KbChunk", KbChunkSchema);
