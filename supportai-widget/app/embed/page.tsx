"use client";

import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { RiRobot2Fill } from "react-icons/ri";

const SOURCE = "supportai_widget";

type RemoteConfig = {
    theme: { primary: string; background: string; panel: string; text: string };
    copy: { title: string; subtitle: string; placeholder: string };
    enableBorder?: boolean;
    borderColor?: string;
};

type ChatMsg = {
    id: string;
    role: "user" | "bot";
    text: string;
    ts: number;
};

const uid = () => {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function EmbedPage() {
    const searchParams = useSearchParams()
    const appKey = searchParams.get('appKey')
    const mode = searchParams.get('mode')
    const parentOrigin = searchParams.get("parentOrigin") || "";

    const initialMode = (mode || "collapsed").trim();
    const masked = useMemo(() => maskKey(appKey!), [appKey]);

    const [open, setOpen] = useState(initialMode === "open");
    const [remote, setRemote] = useState<RemoteConfig | null>(null);
    const [cfgError, setCfgError] = useState<string | null>(null);

    // Messages
    const [text, setText] = useState("");
    const [isBotTyping, setIsBotTyping] = useState(false);

    const [messages, setMessages] = useState<ChatMsg[]>([
        { id: uid(), role: "bot", text: "👋 Hi! I'm your support assistant.", ts: Date.now() },
    ]);

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") handleSend();
    }

    const handleSend = async () => {
        const t = text.trim();
        if (!t || isBotTyping) return;

        const userMsg: ChatMsg = { id: uid(), role: "user", text: t, ts: Date.now() };
        setMessages((prev) => [...prev, userMsg]);
        setText("");
        setIsBotTyping(true);

        setTimeout(() => {
            const botMsg: ChatMsg = {
                id: uid(),
                role: "bot",
                text: `Got it. I’ll help with: "${t}".`,
                ts: Date.now(),
            };
            setMessages((prev) => [...prev, botMsg]);
            setIsBotTyping(false);
        }, 700);
    }

    React.useEffect(() => {
        if (!appKey) return;

        const qs = new URLSearchParams();
        qs.set("appKey", appKey);
        if (parentOrigin) qs.set("parentOrigin", parentOrigin);

        fetch(`/api/widget-config?${qs.toString()}`)
            .then(async (r) => {
                const data = await r.json();
                if (!r.ok) throw new Error(data?.error || "CONFIG_FETCH_FAILED");
                return data;
            })
            .then((data) => {
                setRemote(data);
                setCfgError(null);
            })
            .catch((e) => setCfgError(e.message));
    }, [appKey, parentOrigin]);


    function post(type: "OPEN" | "CLOSE") {
        window.parent?.postMessage({ source: SOURCE, type }, "*");
    }

    function handleOpen() {
        setOpen(true);
        post("OPEN");
    }

    function handleClose() {
        setOpen(false);
        post("CLOSE");
    }

    const panelStyle = {
        ...styles.panel,
        background: remote?.theme?.background || styles.panel.background,
        color: remote?.theme?.text || styles.panel.color,
        border: remote?.enableBorder ? `1px solid ${remote?.borderColor}` : ""
    };

    const launcherStyle = {
        ...styles.launcher,
        background: remote?.theme?.primary || "#7C3AED",
    };


    if (!appKey) {
        return (
            <div style={styles.missing}>
                Missing <b>appKey</b>
            </div>
        );
    }

    if (!open) {
        return (
            <>
                <button style={launcherStyle} className="flex justify-center items-center" onClick={handleOpen} aria-label="Open support">
                    <RiRobot2Fill className="my-auto h-6 w-6" />
                </button>
            </>
        );
    }

    return (
        <div style={panelStyle}>
            <div style={styles.header}>
                <div>
                    <div style={styles.title}>{remote?.copy?.title || "Support"}</div>
                    <div style={styles.sub}>{remote?.copy?.subtitle || ""}</div>
                </div>

                <button style={styles.close} onClick={handleClose} aria-label="Close">
                    <X className="h-4 w-4 mx-auto" />
                </button>
            </div>

            <div style={styles.body} className={`no-scrollbar ${isBotTyping ? "mb-10" : ""}`}>
                {cfgError && (
                    <div style={styles.notice}>
                        Config error: {cfgError}
                    </div>
                )}

                {messages.map((m) => (
                    <div
                        key={m.id}
                        style={{
                            display: "flex",
                            width: "100%",
                            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                        }}
                    >
                        <div style={m.role === "user" ? styles.userMsg : styles.botMsg}>
                            {m.text}
                        </div>
                    </div>
                ))}

                {isBotTyping && (
                    <>
                        <div
                            className="absolute bottom-16 pt-10"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            <style>{`
                  @keyframes healoDotWave {
                    0%, 60%, 100% { transform: translateY(0); opacity: .35; }
                    30% { transform: translateY(-3px); opacity: .85; }
                  }
                  .healo-typing-dot { width: 6px; height: 6px; border-radius: 9999px; background: currentColor; display:inline-block; animation: healoDotWave 1.2s infinite ease-in-out; }
                  .healo-typing-dot:nth-child(1){ animation-delay: 0s; }
                  .healo-typing-dot:nth-child(2){ animation-delay: .15s; }
                  .healo-typing-dot:nth-child(3){ animation-delay: .30s; }
                `}</style>

                            <div className="flex gap-2">
                                {/* <span
                                    className={`text-xs font-medium pt-2 text-white/90`}
                                >
                                    Bot is typing...
                                </span> */}
                                <h2
                                    className={`relative inline-flex items-center gap-1 px-3 py-2 rounded-2xl font-semibold  text-lg bg-white/10 text-white/80`}
                                >
                                    <span className="healo-typing-dot" />
                                    <span className="healo-typing-dot" />
                                    <span className="healo-typing-dot" />
                                </h2>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div style={styles.footer}>
                <div style={styles.composer}>
                    <input
                        style={styles.input}
                        placeholder={remote?.copy?.placeholder || "Type your question..."}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={onKeyDown}
                        disabled={isBotTyping}
                    />

                    <button
                        style={{
                            ...styles.sendBtn,
                            ...(text.trim() && !isBotTyping ? styles.sendBtnActive : styles.sendBtnDisabled),
                            background: text.trim() && !isBotTyping
                                ? (remote?.theme?.primary || "#7C3AED")
                                : "rgba(255,255,255,0.08)",
                            border: text.trim() ? "" : `1px solid ${remote?.theme.primary}`
                        }}
                        onClick={handleSend}
                        disabled={!text.trim() || isBotTyping}
                    >
                        Send
                    </button>
                </div>
            </div>

        </div>
    );
}

function maskKey(k: string) {
    if (k.length <= 10) return k;
    return `${k.slice(0, 6)}…${k.slice(-4)}`;
}

const styles: Record<string, React.CSSProperties> = {
    missing: { padding: 12, fontFamily: "system-ui", fontSize: 13 },
    launcher: {
        border: "0",
        borderRadius: 999,
        color: "white",
        fontWeight: 800,
        fontSize: 18,
        cursor: "pointer",
        overflow: "hidden",
        height: "100vh",
        width: "100vw",
    },
    panel: {
        width: "100vw",
        height: "100vh",
        background: "#0B1220",
        color: "white",
        display: "flex",
        flexDirection: "column",
        borderRadius: 16,
        overflow: "hidden",
    },
    header: {
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255,255,255,0.06)",
    },
    title: { fontWeight: 800, fontSize: 14 },
    sub: { fontSize: 12, opacity: 0.8, marginTop: 2 },
    close: {
        width: 34,
        height: 34,
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        color: "white",
        fontSize: 18,
        lineHeight: "18px",
        cursor: "pointer",
    },
    body: {
        padding: 12,
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
    },
    botMsg: {
        maxWidth: "85%",
        background: "rgba(255,255,255,0.08)",
        padding: "10px 20px 10px 15px",
        borderRadius: 12,
        fontSize: 13,
        lineHeight: "18px",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
    },

    userMsg: {
        maxWidth: "80%",
        background: "rgba(124,58,237,0.45)",
        padding: "10px 12px",
        borderRadius: 14,
        fontSize: 13,
        lineHeight: "18px",
        color: "white",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
    },

    meta: { marginTop: 6, fontSize: 11, opacity: 0.75 },

    footer: {
        padding: 12,
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(11,18,32,0.85)",
        backdropFilter: "blur(10px)",
    },

    composer: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 8,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
    },

    input: {
        flex: 1,
        height: 42,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.18)",
        color: "white",
        padding: "0 12px",
        fontSize: 14,
        outline: "none",
    },

    sendBtn: {
        height: 36,
        minWidth: 80,
        padding: "0 14px",
        borderRadius: 12,
        color: "white",
        fontWeight: 500,
        fontSize: 14,
        cursor: "pointer",
        transition: "transform 120ms ease, opacity 120ms ease",
    },

    sendBtnActive: {
        opacity: 1,
    },

    sendBtnDisabled: {
        cursor: "not-allowed",
    },
};
