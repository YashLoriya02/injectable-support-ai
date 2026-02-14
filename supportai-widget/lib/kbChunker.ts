import { KBChunk } from "@/types";

function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function chunkMarkdown(filename: string, md: string, maxChars = 900): KBChunk[] {
    const lines = md.replace(/\r\n/g, "\n").split("\n");

    let currentTitle = filename;
    let buf: string[] = [];
    const chunks: KBChunk[] = [];

    function flush() {
        const text = buf.join("\n").trim();
        if (!text) return;
        
        if (text.length <= maxChars) {
            chunks.push({ id: uid(), title: currentTitle, text });
            return;
        }
        for (let i = 0; i < text.length; i += maxChars) {
            const part = text.slice(i, i + maxChars).trim();
            if (part) chunks.push({ id: uid(), title: currentTitle, text: part });
        }
    }

    for (const line of lines) {
        const h = line.match(/^(#{1,3})\s+(.*)$/);
        if (h) {
            flush();
            buf = [];
            currentTitle = `${filename} • ${h[2].trim()}`;
            continue;
        }
        buf.push(line);
    }
    flush();

    return chunks;
}
