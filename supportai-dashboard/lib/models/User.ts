import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
    {
        name: { type: String, default: "" },
        email: { type: String, required: true, unique: true, index: true },
        passwordHash: { type: String, default: "" },
        provider: { type: String, enum: ["credentials", "google"], default: "credentials" },
        emailVerifiedAt: { type: Date, default: null },
        emailVerifyTokenHash: { type: String, default: "" },
        emailVerifyTokenExpiresAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
