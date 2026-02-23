"use client";

/**
 * MdPreviewDrawer
 * ───────────────
 * Full-screen slide-over drawer that shows:
 *   LEFT  — editable raw Markdown textarea
 *   RIGHT — live-rendered HTML preview (updates on every keystroke)
 *
 * Dependencies: marked  (npm i marked)
 * Falls back to a lightweight regex renderer if marked is unavailable.
 *
 * Usage:
 *   <MdPreviewDrawer
 *     open={drawerOpen}
 *     value={mdText}
 *     onChange={setMdText}
 *     onClose={() => setDrawerOpen(false)}
 *   />
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Copy, Check, Columns2, AlignLeft, Eye } from "lucide-react";

function simpleParse(md: string): string {
    return md
        // fenced code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => `<pre class="md-pre"><code class="md-code">${escHtml(code.trimEnd())}</code></pre>`)
        // inline code
        .replace(/`([^`]+)`/g, (_, c) => `<code class="md-inline-code">${escHtml(c)}</code>`)
        // headings
        .replace(/^#{6}\s(.+)$/gm, "<h6 class='md-h6'>$1</h6>")
        .replace(/^#{5}\s(.+)$/gm, "<h5 class='md-h5'>$1</h5>")
        .replace(/^#{4}\s(.+)$/gm, "<h4 class='md-h4'>$1</h4>")
        .replace(/^#{3}\s(.+)$/gm, "<h3 class='md-h3'>$1</h3>")
        .replace(/^#{2}\s(.+)$/gm, "<h2 class='md-h2'>$1</h2>")
        .replace(/^#{1}\s(.+)$/gm, "<h1 class='md-h1'>$1</h1>")
        // bold + italic
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // blockquote
        .replace(/^>\s(.+)$/gm, "<blockquote class='md-blockquote'>$1</blockquote>")
        // hr
        .replace(/^---$/gm, "<hr class='md-hr' />")
        // unordered list items
        .replace(/^\s*[-*+]\s(.+)$/gm, "<li class='md-li'>$1</li>")
        // ordered list items
        .replace(/^\s*\d+\.\s(.+)$/gm, "<li class='md-oli'>$1</li>")
        // links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>`)
        // paragraphs (double newlines)
        .replace(/\n\n([^<])/g, "\n\n<p class='md-p'>$1")
        .replace(/([^>])\n\n/g, "$1</p>\n\n");
}
function escHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── attempt to use 'marked' dynamically ─────────────────────────────────────
let markedParse: ((s: string) => string) | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { marked } = require("marked");
    markedParse = (s: string) => marked(s) as string;
} catch {
    // marked not installed — fall back to simpleParse
}

function renderMd(raw: string): string {
    return markedParse ? markedParse(raw) : simpleParse(raw);
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface MdPreviewDrawerProps {
    open: boolean;
    value: string;
    onChange: (v: string) => void;
    onClose: () => void;
    fileName?: string;
}

// ─── Layout modes ─────────────────────────────────────────────────────────────
type LayoutMode = "split" | "raw" | "preview";

// ─── Component ────────────────────────────────────────────────────────────────
export default function MdPreviewDrawer({
    open,
    value,
    onChange,
    onClose,
    fileName = "docs.md",
}: MdPreviewDrawerProps) {
    const [layout, setLayout] = useState<LayoutMode>("split");
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    // Focus textarea when drawer opens
    useEffect(() => {
        if (open) setTimeout(() => textareaRef.current?.focus(), 120);
    }, [open]);

    // ESC to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    function copyRaw() {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    const renderedHtml = renderMd(value);

    const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
    const lineCount = value.split("\n").length;

    return (
        <>
            {/* ── Backdrop ── */}
            <div
                className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
            />

            {/* ── Drawer panel ── */}
            <div
                className={`fixed inset-0 z-50 flex flex-col transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
                style={{ background: "#0a0f1a" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 shrink-0" style={{ background: "#0d1525" }}>
                    {/* Left — file name + stats */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="text-sm font-mono text-white/70 truncate">{fileName}</div>
                        <div className="hidden sm:flex items-center gap-2 text-[11px] text-white/30 font-mono">
                            <span>{wordCount.toLocaleString()} words</span>
                            <span>·</span>
                            <span>{lineCount.toLocaleString()} lines</span>
                            <span>·</span>
                            <span>{value.length.toLocaleString()} chars</span>
                        </div>
                    </div>

                    {/* Centre — layout toggle */}
                    <div className="flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 p-1">
                        {(
                            [
                                { mode: "raw" as LayoutMode, icon: <AlignLeft className="h-3.5 w-3.5" />, label: "Raw" },
                                { mode: "split" as LayoutMode, icon: <Columns2 className="h-3.5 w-3.5" />, label: "Split" },
                                { mode: "preview" as LayoutMode, icon: <Eye className="h-3.5 w-3.5" />, label: "Preview" },
                            ] as const
                        ).map(({ mode, icon, label }) => (
                            <button
                                key={mode}
                                onClick={() => setLayout(mode)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${layout === mode
                                    ? "bg-white/15 text-white"
                                    : "text-white/40 hover:text-white/70"
                                    }`}
                            >
                                {icon}
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Right — copy + close */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={copyRaw}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                            {copied
                                ? <><Check className="h-3.5 w-3.5 text-green-400" /><span className="hidden sm:inline text-green-400">Copied</span></>
                                : <><Copy className="h-3.5 w-3.5" /><span className="hidden sm:inline">Copy</span></>
                            }
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center h-8 w-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* ── Panes ── */}
                <div className="flex flex-1 min-h-0 overflow-hidden">
                    {/* LEFT — Raw editor */}
                    {(layout === "split" || layout === "raw") && (
                        <div
                            className={`flex flex-col min-h-0 border-r border-white/8 ${layout === "split" ? "w-1/2" : "w-full"}`}
                        >
                            <div className="px-4 py-2 text-[11px] text-white/30 font-mono uppercase tracking-widest border-b border-white/5 shrink-0 flex items-center justify-between">
                                <span>Markdown source</span>
                                <span className="text-white/20">edit here</span>
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                spellCheck={false}
                                className="flex-1 w-full resize-none bg-transparent px-5 py-4 text-sm font-mono text-white/80 outline-none leading-relaxed"
                                style={{
                                    caretColor: "#818cf8",
                                    tabSize: 2,
                                }}
                                placeholder={"# Your title\n\nStart writing Markdown here...\n\n## Section\n\nParagraph text, **bold**, *italic*, `code`.\n\n- list item\n- another item"}
                            />
                        </div>
                    )}

                    {/* RIGHT — Rendered preview */}
                    {(layout === "split" || layout === "preview") && (
                        <div
                            ref={previewRef}
                            className={`flex flex-col min-h-0 overflow-y-auto ${layout === "split" ? "w-1/2" : "w-full"}`}
                        >
                            <div className="px-4 py-2 text-[11px] text-white/30 font-mono uppercase tracking-widest border-b border-white/5 shrink-0 sticky top-0 z-10" style={{ background: "#0a0f1a" }}>
                                <span>Rendered preview</span>
                            </div>

                            {value.trim() === "" ? (
                                <div className="flex flex-1 items-center justify-center text-white/20 text-sm">
                                    Nothing to preview yet
                                </div>
                            ) : (
                                <div
                                    className="md-body flex-1 px-8 py-6"
                                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Scoped prose styles injected once ── */}
            <style>{`
                .md-body {
                    color: rgba(255,255,255,0.82);
                    font-size: 0.9rem;
                    line-height: 1.75;
                    max-width: 72ch;
                }
                .md-body h1, .md-h1 { font-size: 1.75rem; font-weight: 700; margin: 1.6rem 0 0.6rem; color: #fff; letter-spacing: -0.02em; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.4rem; }
                .md-body h2, .md-h2 { font-size: 1.35rem; font-weight: 700; margin: 1.4rem 0 0.5rem; color: #e2e8f0; letter-spacing: -0.01em; }
                .md-body h3, .md-h3 { font-size: 1.1rem; font-weight: 600; margin: 1.2rem 0 0.4rem; color: #cbd5e1; }
                .md-body h4, .md-h4 { font-size: 0.95rem; font-weight: 600; margin: 1rem 0 0.3rem; color: #94a3b8; }
                .md-body h5, .md-h5 { font-size: 0.875rem; font-weight: 600; color: #64748b; margin: 0.8rem 0 0.25rem; }
                .md-body h6, .md-h6 { font-size: 0.8rem; font-weight: 600; color: #475569; margin: 0.7rem 0 0.2rem; }
                .md-body p, .md-p { margin: 0.8rem 0; }
                .md-body a, .md-link { color: #818cf8; text-decoration: underline; text-underline-offset: 3px; }
                .md-body a:hover { color: #a5b4fc; }
                .md-body strong { color: #fff; font-weight: 600; }
                .md-body em { color: #cbd5e1; font-style: italic; }
                .md-body ul { list-style: disc; padding-left: 1.5rem; margin: 0.6rem 0; }
                .md-body ol { list-style: decimal; padding-left: 1.5rem; margin: 0.6rem 0; }
                .md-body li, .md-li, .md-oli { margin: 0.25rem 0; }
                .md-body blockquote, .md-blockquote {
                    border-left: 3px solid #818cf8;
                    padding: 0.4rem 1rem;
                    margin: 1rem 0;
                    background: rgba(129,140,248,0.06);
                    border-radius: 0 8px 8px 0;
                    color: rgba(255,255,255,0.6);
                    font-style: italic;
                }
                .md-body hr, .md-hr {
                    border: none;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    margin: 1.5rem 0;
                }
                .md-body pre, .md-pre {
                    background: rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 10px;
                    padding: 1rem 1.2rem;
                    overflow-x: auto;
                    margin: 1rem 0;
                    font-size: 0.8rem;
                    line-height: 1.6;
                }
                .md-body code, .md-inline-code {
                    background: rgba(129,140,248,0.12);
                    border: 1px solid rgba(129,140,248,0.2);
                    border-radius: 5px;
                    padding: 0.15em 0.4em;
                    font-size: 0.82em;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    color: #a5b4fc;
                }
                .md-body pre code {
                    background: transparent;
                    border: none;
                    padding: 0;
                    color: rgba(255,255,255,0.75);
                }
                .md-body table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1rem 0;
                    font-size: 0.85rem;
                }
                .md-body th {
                    text-align: left;
                    padding: 0.5rem 0.75rem;
                    background: rgba(255,255,255,0.05);
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    font-weight: 600;
                    color: #e2e8f0;
                }
                .md-body td {
                    padding: 0.4rem 0.75rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    color: rgba(255,255,255,0.7);
                }
                .md-body tr:hover td { background: rgba(255,255,255,0.02); }
            `}</style>
        </>
    );
}