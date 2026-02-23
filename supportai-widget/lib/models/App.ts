import { Schema, model, models } from "mongoose";

const ThemeSchema = new Schema(
    {
        primary: { type: String, default: "#7C3AED" },
        background: { type: String, default: "#0B1220" },
        panel: { type: String, default: "#0B1220" },
        text: { type: String, default: "#FFFFFF" },
    },
    { _id: false }
);

const CopySchema = new Schema(
    {
        title: { type: String, default: "Support" },
        subtitle: { type: String, default: "Ask anything — I'm here to help." },
        placeholder: { type: String, default: "Type your question..." },
    },
    { _id: false }
);

const AppSchema = new Schema(
    {
        ownerId: { type: String, required: true, index: true },
        name: { type: String, required: true },
        appKey: { type: String, required: true, unique: true, index: true },

        allowedDomains: { type: [String], default: [] },

        theme: { type: ThemeSchema, default: () => ({}) },
        copy: { type: CopySchema, default: () => ({}) },
        enableBorder: { type: Boolean, default: false },
        borderColor: { type: String, default: "rgba(255,255,255,0.12)" },

        kbVersion: { type: Number, default: 0 },
        lastUpdatedAt: { type: Number, default: () => Date.now() },
    },
    { timestamps: true }
);

AppSchema.index({ ownerId: 1, createdAt: -1 });

export const AppModel = models.App || model("App", AppSchema);
