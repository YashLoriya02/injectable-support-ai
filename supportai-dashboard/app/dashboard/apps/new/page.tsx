"use client";

import React, { useMemo, useRef, useState } from "react";
import { toast } from 'sonner'

function parseDomains(s: string) {
    return s
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
        .map((d) => d.replace(/^https?:\/\//, "").replace(/\/.*$/, ""));
}

export default function NewAppPage() {
    const [name, setName] = useState("");
    const [domainInput, setDomainInput] = useState("");
    const [domains, setDomains] = useState<string[]>([]);
    const [tab, setTab] = useState<"paste" | "upload">("paste");
    const [mdText, setMdText] = useState("");
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>("");
    const [isDragging, setIsDragging] = useState(false);

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [ok, setOk] = useState<any>(null);

    const canCreate = useMemo(() => name.trim().length > 0, [name]);

    function addDomainsFromInput() {
        const next = parseDomains(domainInput);
        if (!next.length) return;
        const merged = Array.from(new Set([...domains, ...next]));
        setDomains(merged);
        setDomainInput("");
    }

    function removeDomain(d: string) {
        setDomains((prev) => prev.filter((x) => x !== d));
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFileName(file.name);
        } else {
            setSelectedFileName("");
        }
    }

    function handleUploadAreaClick() {
        fileRef.current?.click();
    }

    function handleRemoveFile() {
        if (fileRef.current) {
            fileRef.current.value = "";
        }

        setSelectedFileName("");
    }

    function handleDragEnter(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }

    function handleDragLeave(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.name.endsWith('.md') || file.type === 'text/markdown') {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                if (fileRef.current) {
                    fileRef.current.files = dataTransfer.files;
                }

                setSelectedFileName(file.name);
            }
        }
    }

    async function onCreate(e: React.FormEvent) {
        e.preventDefault();
        setErr("");
        setOk(null);
        setLoading(true);

        try {
            const r = await fetch("/api/apps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    allowedDomains: domains,
                    markdownRaw: tab === "paste" ? mdText : "",
                }),
            });

            const data = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(data?.error || "CREATE_APP_FAILED");

            if (tab === "upload") {
                const file = fileRef.current?.files?.[0];
                if (file) {
                    const fd = new FormData();
                    fd.append("file", file);
                    const up = await fetch(`/api/apps/${data.appId}/markdown`, { method: "POST", body: fd });
                    const upData = await up.json().catch(() => ({}));
                    if (!up.ok) throw new Error(upData?.error || "MD_UPLOAD_FAILED");
                }
            }

            setOk(data);
            toast.success('App created successfully')

            setTimeout(() => {
                window.location.href = `/dashboard/apps/${data.appId}/setup?appKey=${encodeURIComponent(data.appKey)}`;
            }, 1000);
        } catch (e: any) {
            setErr(e.message || "CREATE_APP_FAILED");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-6xl flex flex-col justify-center items-center space-y-4">
            <div className="w-2xl">
                <div className="text-lg font-bold">Create App</div>
                <div className="text-sm text-white/60">
                    Allowed domains prevent appKey misuse. Add your product docs as Markdown.
                </div>
            </div>

            {err && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {err}
                </div>
            )}

            {ok && (
                <div className="rounded-xl border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                    Created! Redirecting...
                    <div className="mt-2 text-xs text-white/80">
                        appKey: <span className="font-mono">{ok.appKey}</span>
                    </div>
                </div>
            )}

            <form onSubmit={onCreate} className="w-2xl rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
                <div className="space-y-1">
                    <div className="text-xs text-white/60">App name</div>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Acme Support"
                        className="w-full h-11 rounded-xl bg-black/30 border border-white/10 px-3 text-sm outline-none"
                    />
                </div>

                {/* domains */}
                <div className="space-y-2">
                    <div className="text-xs text-white/60">Allowed domains</div>
                    <div className="flex gap-2">
                        <input
                            value={domainInput}
                            onChange={(e) => setDomainInput(e.target.value)}
                            placeholder="example.com, app.example.com, localhost"
                            className="flex-1 h-11 rounded-xl bg-black/30 border border-white/10 px-3 text-sm outline-none"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addDomainsFromInput();
                                }
                            }}
                        />
                        <button
                            type="button"
                            onClick={addDomainsFromInput}
                            className="h-11 px-4 rounded-xl bg-white text-black font-bold text-sm hover:opacity-90"
                        >
                            Add
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {domains.length === 0 ? (
                            <div className="text-xs text-white/40">No domains added yet.</div>
                        ) : (
                            domains.map((d) => (
                                <span
                                    key={d}
                                    className="text-xs px-2 py-1 rounded-lg border border-white/10 bg-black/20 text-white/80 inline-flex items-center gap-2"
                                >
                                    {d}
                                    <button
                                        type="button"
                                        onClick={() => removeDomain(d)}
                                        className="text-white/60 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))
                        )}
                    </div>
                </div>

                {/* Markdown */}
                <div className="space-y-2">
                    <div className="text-xs text-white/60">Product docs (Markdown)</div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setTab("paste")}
                            className={`h-9 px-3 rounded-xl text-sm border ${tab === "paste" ? "bg-white text-black border-white" : "bg-white/5 border-white/10 hover:bg-white/10"
                                }`}
                        >
                            Paste
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("upload")}
                            className={`h-9 px-3 rounded-xl text-sm border ${tab === "upload" ? "bg-white text-black border-white" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                        >
                            Upload .md
                        </button>
                    </div>

                    {tab === "paste" ? (
                        <textarea
                            value={mdText}
                            onChange={(e) => setMdText(e.target.value)}
                            placeholder={"# Pricing\n...\n\n# Refunds\n...\n\n# Setup\n..."}
                            className="w-full min-h-45 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none"
                        />
                    ) : (
                        <div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".md,text/markdown"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            {!selectedFileName ? (
                                <div
                                    onClick={handleUploadAreaClick}
                                    onDragEnter={handleDragEnter}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`rounded-xl cursor-pointer border-2 border-dashed p-8 transition-all ${isDragging
                                        ? "border-white/70 bg-white/10"
                                        : "border-white/30 bg-black/20 hover:border-white/50 hover:bg-black/30"
                                        }`}
                                >
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-white/80 font-medium">
                                                {isDragging ? "Drop your file here" : "Click to upload Markdown file"}
                                            </div>
                                            <div className="text-xs text-white/50 mt-1">or drag and drop your .md file here</div>
                                        </div>
                                        <div className="text-xs text-white/40">Supports .md files only</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-white/20 bg-black/30 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="text-sm text-white/90 font-medium">{selectedFileName}</div>
                                                <div className="text-xs text-white/50 mt-0.5">Ready to upload</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveFile}
                                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white/90 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button
                    disabled={loading || !canCreate}
                    className="w-full h-11 rounded-xl bg-white text-black font-bold text-sm disabled:opacity-60 hover:opacity-90"
                >
                    {loading ? "Creating..." : "Create App"}
                </button>
            </form>
        </div>
    );
}