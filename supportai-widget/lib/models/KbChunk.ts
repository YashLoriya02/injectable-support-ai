import mongoose, { Schema } from "mongoose";

const KbChunkSchema = new Schema(
    {
        appKey: { type: String, index: true, required: true },
        title: { type: String, required: true },
        text: { type: String, required: true },
        sourceFile: { type: String, default: "" },
    },
    { timestamps: true }
);

KbChunkSchema.index({ appKey: 1, title: "text", text: "text" });

const MODEL_NAME = "kbchunk";

export const KbChunk =
    (mongoose.models[MODEL_NAME] as mongoose.Model<any>) ||
    mongoose.model(MODEL_NAME, KbChunkSchema);
