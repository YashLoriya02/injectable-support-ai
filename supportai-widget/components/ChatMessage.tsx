"use client";

type Props = {
    role: "user" | "bot";
    text: string;
    primary?: string; // pass the dynamic theme color
};

function escHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderChatMd(raw: string): string {
    let html = escHtml(raw);

    // Fenced code blocks
    html = html.replace(
        /```(\w*)\n([\s\S]*?)```/g,
        (_, _lang, code) => `<pre class="cm-pre"><code>${code.trimEnd()}</code></pre>`
    );

    // Headings
    html = html
        .replace(/^#{3}\s(.+)$/gm, "<h3 class='cm-h3'>$1</h3>")
        .replace(/^#{2}\s(.+)$/gm, "<h2 class='cm-h2'>$1</h2>")
        .replace(/^#{1}\s(.+)$/gm, "<h1 class='cm-h1'>$1</h1>");

    // Horizontal rule
    html = html.replace(/^---$/gm, "<hr class='cm-hr' />");

    // Unordered lists
    html = html.replace(/^[-*+]\s(.+)$/gm, "<cm-li>$1</cm-li>");
    html = html.replace(/(<cm-li>[\s\S]*?<\/cm-li>)(\n<cm-li>[\s\S]*?<\/cm-li>)*/g, (block) => {
        const items = block
            .split("\n")
            .filter(Boolean)
            .map((line) => line.replace(/<cm-li>(.*)<\/cm-li>/, "<li>$1</li>"))
            .join("");
        return `<ul class="cm-ul">${items}</ul>`;
    });

    // Ordered lists
    html = html.replace(/^\d+\.\s(.+)$/gm, "<cm-oli>$1</cm-oli>");
    html = html.replace(/(<cm-oli>[\s\S]*?<\/cm-oli>)(\n<cm-oli>[\s\S]*?<\/cm-oli>)*/g, (block) => {
        const items = block
            .split("\n")
            .filter(Boolean)
            .map((line) => line.replace(/<cm-oli>(.*)<\/cm-oli>/, "<li>$1</li>"))
            .join("");
        return `<ol class="cm-ol">${items}</ol>`;
    });

    // Blockquote
    html = html.replace(/^&gt;\s(.+)$/gm, "<blockquote class='cm-bq'>$1</blockquote>");

    // Bold + italic
    html = html
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Inline code
    html = html.replace(/`([^`]+)`/g, `<code class="cm-code">$1</code>`);

    // Links
    html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        `<a href="$2" target="_blank" rel="noopener" class="cm-a">$1</a>`
    );

    // Paragraphs: wrap plain lines that aren't already block elements
    const blockTags = /^<(h[1-6]|ul|ol|pre|blockquote|hr)/;
    const lines = html.split("\n");
    const out: string[] = [];
    for (const line of lines) {
        if (line.trim() === "") continue;
        out.push(blockTags.test(line.trim()) ? line : `<p class="cm-p">${line}</p>`);
    }

    return out.join("\n");
}

export default function ChatMessage({ role, text, primary = "#7C3AED" }: Props) {
    const isBot = role === "bot";

    return (
        <>
            <div className={`cm-wrap ${isBot ? "cm-bot" : "cm-user"}`}>
                <div
                    className={`cm-bubble ${isBot ? "cm-bubble-bot" : "cm-bubble-user"}`}
                    // Inject primary as a CSS variable so the style block below can use it
                    style={!isBot ? { background: primary } : undefined}
                >
                    {isBot ? (
                        <div
                            className="cm-body"
                            dangerouslySetInnerHTML={{ __html: renderChatMd(text) }}
                        />
                    ) : (
                        <span className="cm-user-text">{text}</span>
                    )}
                </div>
            </div>

            <style>{`
                .cm-wrap { display: flex; width: 100%; margin: 12px 0; }
                .cm-bot  { justify-content: flex-start; }
                .cm-user { justify-content: flex-end; }

                .cm-bubble {
                    max-width: 82%;
                    padding: 10px 14px;
                    border-radius: 16px;
                    font-size: 0.875rem;
                    line-height: 1.65;
                    word-break: break-word;
                }
                .cm-bubble-bot {
                    background: rgba(255,255,255,0.07);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-bottom-left-radius: 4px;
                    color: rgba(255,255,255,0.88);
                }
                .cm-bubble-user {
                    /* background set via inline style with dynamic primary */
                    border-bottom-right-radius: 4px;
                    color: #fff;
                }
                .cm-user-text { white-space: pre-wrap; }

                .cm-body { all: unset; display: block; }
                .cm-body .cm-p { margin: 0 0 0.55rem; color: rgba(255,255,255,0.88); }
                .cm-body .cm-p:last-child { margin-bottom: 0; }

                .cm-body .cm-h1 { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0.9rem 0 0.4rem; }
                .cm-body .cm-h2 { font-size: 1rem;   font-weight: 700; color: #e2e8f0; margin: 0.8rem 0 0.35rem; }
                .cm-body .cm-h3 { font-size: 0.9rem; font-weight: 600; color: #cbd5e1; margin: 0.7rem 0 0.3rem; }

                .cm-body .cm-ul,
                .cm-body .cm-ol { padding-left: 1.3rem; margin: 0.4rem 0 0.6rem; }
                .cm-body .cm-ul { list-style: disc; }
                .cm-body .cm-ol { list-style: decimal; }
                .cm-body .cm-ul li,
                .cm-body .cm-ol li { margin: 0.1rem 0; color: rgba(255,255,255,0.85); padding-left: 0.2rem; }

                .cm-body .cm-code {
                    background: rgba(129,140,248,0.15);
                    border: 1px solid rgba(129,140,248,0.25);
                    border-radius: 4px;
                    padding: 0.1em 0.38em;
                    font-size: 0.8em;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    color: #a5b4fc;
                }
                .cm-body .cm-pre {
                    background: rgba(0,0,0,0.45);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 8px;
                    padding: 0.75rem 1rem;
                    overflow-x: auto;
                    margin: 0.6rem 0;
                    font-size: 0.78rem;
                    line-height: 1.55;
                }
                .cm-body .cm-pre code {
                    background: transparent; border: none; padding: 0;
                    color: rgba(255,255,255,0.78);
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                }
                .cm-body .cm-bq {
                    border-left: 3px solid #6366f1;
                    background: rgba(99,102,241,0.08);
                    border-radius: 0 6px 6px 0;
                    padding: 0.35rem 0.9rem;
                    margin: 0.5rem 0;
                    color: rgba(255,255,255,0.6);
                    font-style: italic;
                }
                .cm-body .cm-hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 0.9rem 0; }
                .cm-body .cm-a { color: #818cf8; text-decoration: underline; text-underline-offset: 3px; }
                .cm-body .cm-a:hover { color: #a5b4fc; }
                .cm-body strong { color: #fff; font-weight: 600; }
                .cm-body em { color: #cbd5e1; font-style: italic; }
            `}</style>
        </>
    );
}