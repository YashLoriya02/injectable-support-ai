import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || "";
if (!MONGO_URI) throw new Error("Missing MONGODB_URI");

let cached = (global as any).mongoose;
if (!cached) (global as any).mongoose = cached = { conn: null, promise: null };

export async function connectMongo() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = await mongoose.connect(MONGO_URI);
  }
  cached.conn = await cached.promise;

  return cached.conn;
}
