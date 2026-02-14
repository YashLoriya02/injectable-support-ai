import { AppKB, KBChunk } from "@/types";

const KB: Record<string, AppKB> = {};

export function upsertKB(appKey: string, chunks: KBChunk[]) {
    KB[appKey] = { chunks, updatedAt: Date.now() };
}

export function appendKB(appKey: string, chunks: KBChunk[]) {
    const existing = KB[appKey]?.chunks || [];
    KB[appKey] = { chunks: [...existing, ...chunks], updatedAt: Date.now() };
}

export function getKB(appKey: string): KBChunk[] {
    return KB[appKey]?.chunks || [];
}
