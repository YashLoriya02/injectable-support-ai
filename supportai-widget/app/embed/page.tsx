"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { RiRobot2Fill } from "react-icons/ri";
import { ChatMsg, RemoteConfig } from "@/types";

const SOURCE = "supportai_widget";
const STORAGE_KEY = "supportai_conv_id";

function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function EmbedPage() {
    const searchParams = useSearchParams();
    const appKey = searchParams.get("appKey") || "";
    const mode = searchParams.get("mode") || "collapsed";
    const parentOrigin = searchParams.get("parentOrigin") || "";

    const initialMode = mode.trim();
    const [open, setOpen] = useState(initialMode === "open");
    const [remote, setRemote] = useState<RemoteConfig | null>(null);
    const [cfgError, setCfgError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string>("");

    const primary = remote?.theme?.primary || "#7C3AED";
    const bg = remote?.theme?.background || "#0B1220";
    const textColor = remote?.theme?.text || "#FFFFFF";

    const [text, setText] = useState("");
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [messages, setMessages] = useState<ChatMsg[]>([
        { id: uid(), role: "bot", text: "Hi! I'm your support assistant. \nHow can I help you today ?", ts: Date.now() },
    ]);

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    useEffect(() => {
        if (!appKey) return;
        const cid = localStorage.getItem(STORAGE_KEY) || "";
        if (!cid) return;

        fetch(`/api/conversations/${cid}`)
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data?.messages)) setMessages(data.messages);
                if (data?.conversationId) setConversationId(data.conversationId);
            })
            .catch(() => { });
    }, [appKey]);


    useEffect(() => {
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

    useEffect(() => {
        if (!autoScroll) return;
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, isBotTyping, autoScroll]);

    async function handleNewChat() {
        const r = await fetch("/api/conversations/new", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appKey, parentOrigin, currentConversationId: conversationId }),
        });
        const data = await r.json();
        if (!r.ok) return;

        setConversationId(data.conversationId);
        localStorage.setItem(STORAGE_KEY, data.conversationId);

        setMessages([{ id: uid(), role: "bot", text: "Hi! I'm your support assistant. \nHow can I help you today ?", ts: Date.now() }]);
        setText("");
        setIsBotTyping(false);
    }

    function handleScroll() {
        const el = scrollRef.current;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
        setAutoScroll(distanceFromBottom < 120);
    }

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

    async function handleSend() {
        const t = text.trim();
        if (!t || isBotTyping) return;

        setText("");
        setIsBotTyping(true);

        const userId = uid();
        const botId = uid();

        const userMsg: ChatMsg = { id: userId, role: "user", text: t, ts: Date.now() };
        const botPlaceholder: ChatMsg = { id: botId, role: "bot", text: "", ts: Date.now() };

        // ✅ Build next state synchronously (no race)
        const next = [...messages, userMsg, botPlaceholder];
        setMessages(next);

        const payloadMessages = next.map((m) => ({
            id: m.id,
            role: m.role,
            text: m.text,
            ts: m.ts,
        }));

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appKey,
                    parentOrigin,
                    conversationId,
                    messages: payloadMessages,
                }),
            });

            if (!res.ok || !res.body) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || "CHAT_FAILED");
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            const applyToken = (token: string) => {
                setMessages((prev) =>
                    prev.map((m) => (m.id === botId ? { ...m, text: m.text + token } : m))
                );
            };

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const frames = buffer.split("\n\n");
                buffer = frames.pop() || "";

                for (const frame of frames) {
                    const lines = frame.split("\n");
                    const event = (lines.find((l) => l.startsWith("event:")) || "").replace("event:", "").trim();
                    const dataRaw = (lines.find((l) => l.startsWith("data:")) || "").replace("data:", "").trim();

                    if (!event) continue;

                    if (event === "start") {
                        const payload = JSON.parse(dataRaw || "{}");
                        if (payload?.conversationId) {
                            setConversationId(payload.conversationId);
                            localStorage.setItem(STORAGE_KEY, payload.conversationId);
                        }
                    }

                    if (event === "token") {
                        const payload = JSON.parse(dataRaw || "{}");
                        if (payload?.token) applyToken(String(payload.token));
                    }

                    if (event === "error") {
                        const payload = JSON.parse(dataRaw || "{}");
                        throw new Error(payload?.error || "STREAM_ERROR");
                    }
                }
            }
        } catch (e) {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === botId ? { ...m, text: "Sorry — I couldn’t respond right now." } : m
                )
            );
        } finally {
            setIsBotTyping(false);
        }
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") handleSend();
    }

    if (!appKey) {
        return (
            <div className="p-3 text-sm text-white bg-black">
                Missing <b>appKey</b>
            </div>
        );
    }

    if (!open) {
        return (
            <button
                onClick={handleOpen}
                aria-label="Open support"
                className="w-full h-full flex items-center justify-center rounded-full text-white"
                style={{ background: primary }}
            >
                <RiRobot2Fill className="h-6 w-6" />
            </button>
        );
    }

    return (
        <div
            className="relative w-full h-full text-white flex flex-col overflow-hidden rounded-2xl"
            style={{
                ["--primary" as any]: primary,
                background: bg,
                color: textColor,
                border: remote?.enableBorder ? `1px solid ${remote?.borderColor || "rgba(255,255,255,0.12)"}` : undefined,
            }}
        >
            <div className="px-4 py-3 flex items-center justify-between bg-white/5 border-b border-white/10">
                <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{remote?.copy?.title || "Support"}</div>
                    <div className="text-xs text-white/70 truncate">
                        {remote?.copy?.subtitle || "This is Support AI built for your queries."}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleNewChat}
                        className="text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                    >
                        New chat
                    </button>
                    <button
                        onClick={handleClose}
                        aria-label="Close"
                        className="h-8 w-8 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 no-scrollbar overflow-y-auto p-3 space-y-3"
            >
                {
                    cfgError ? (
                        <div className="text-base text-red-500 bg-white/5 border border-red-500 rounded-xl px-3 py-2">
                            Config error: {cfgError}
                        </div>
                    ) : <>
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={`w-full flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={[
                                        "max-w-[78%] py-2 rounded-xl text-sm leading-5",
                                        "whitespace-pre-wrap wrap-break-word",
                                        m.role === "user" ? "px-3 bg-(--primary)/70 text-white" : "bg-white/8 text-white pl-3 pr-5",
                                    ].join(" ")}
                                    style={{ overflowWrap: "anywhere" }}
                                >
                                    {m.text}
                                </div>
                            </div>
                        ))}

                        {/* {isBotTyping && (
                            <>
                                <div
                                    className=""
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
                                        <h2
                                            className={`relative inline-flex items-center gap-1 px-4 py-3 rounded-xl font-semibold text-lg bg-white/10 text-white/80`}
                                        >
                                            <span className="healo-typing-dot" />
                                            <span className="healo-typing-dot" />
                                            <span className="healo-typing-dot" />
                                        </h2>
                                    </div>
                                </div>
                            </>
                        )} */}

                        <div ref={bottomRef} />
                    </>
                }

            </div>

            {
                !cfgError &&
                <div className="p-3 border-t border-white/10 bg-black/10 backdrop-blur">
                    <div className="flex items-center gap-2 p-2 rounded-2xl border border-white/10 bg-white/5">
                        <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={onKeyDown}
                            disabled={isBotTyping}
                            placeholder={remote?.copy?.placeholder || "Type your question..."}
                            className="flex-1 h-10 px-3 rounded-xl bg-black/20 border border-white/10 text-white text-sm outline-none placeholder:text-white/50 disabled:opacity-60"
                        />

                        <button
                            onClick={handleSend}
                            disabled={!text.trim() || isBotTyping}
                            className={`${!text.trim() || isBotTyping ? "" : "bg-(--primary)"} border border-(--primary) h-9 px-4 rounded-xl font-semibold text-sm transition active:scale-[0.98] disabled:cursor-not-allowed hover:brightness-110`}
                        >
                            Send
                        </button>
                    </div>
                </div>
            }
        </div>
    );
}
