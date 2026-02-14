import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
    {
        id: { type: String, required: true },
        role: { type: String, enum: ["user", "bot"], required: true },
        text: { type: String, required: true },
        ts: { type: Number, required: true },
    },
    { _id: false }
);

const ConversationSchema = new Schema(
    {
        appKey: { type: String, required: true, index: true },
        parentOrigin: { type: String, default: "" },
        isActive: { type: Boolean, default: true, index: true },
        visitorId: { type: String, default: "" },
        messages: { type: [MessageSchema], default: [] },
        lastActivityAt: { type: Number, default: () => Date.now() },
    },
    { timestamps: true }
);

ConversationSchema.index({ appKey: 1, visitorId: 1, lastActivityAt: -1 });

const MODEL_NAME = "conversation";

export const Conversation =
    (mongoose.models[MODEL_NAME] as mongoose.Model<any>) ||
    mongoose.model(MODEL_NAME, ConversationSchema);
