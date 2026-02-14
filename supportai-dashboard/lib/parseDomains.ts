export function parseDomains(input: string | string[]) {
    const raw = Array.isArray(input) ? input.join(",") : String(input || "");
    return raw
        .split(/[, \n]/g)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((d) => d.replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
        .map((d) => d.toLowerCase());
}
