"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Copy, Trash2, Save, AlertCircle, ScanEye, Upload } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "sonner";
import MdPreviewDrawer from "@/components/MDPreviewDrawer";
import { BiLoader } from "react-icons/bi";
import { IoBuild } from "react-icons/io5";
import Link from "next/link";

type AppDoc = {
    _id: string;
    name: string;
    appKey: string;
    allowedDomains: string[];
    theme: { primary: string; background: string; panel: string; text: string };
    copy: { title: string; subtitle: string; placeholder: string };
    enableBorder: boolean;
    borderColor: string;
    kb: string;
};

function domainsToText(arr: string[]) {
    return (arr || []).join(", ");
}

function cleanDomain(raw: string) {
    return raw
        .split(",")
        .map((d) =>
            d.trim()
                .replace(/^https?:\/\//i, "")
                .replace(/\/.*$/, "")
        )
        .join(", ");
}

function ColorInput({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    function toHex(c: string): string {
        try {
            const ctx = document.createElement("canvas").getContext("2d")!;
            ctx.fillStyle = c;
            return ctx.fillStyle;
        } catch {
            return "#000000";
        }
    }

    const swatchRef = useRef<HTMLInputElement>(null);

    return (
        <label className="space-y-1">
            <div className="text-xs text-white/60 capitalize">{label}</div>
            <div className="flex items-center gap-2 h-10 rounded-xl bg-black/30 border border-white/10 px-2">
                <div
                    className="h-6 w-6 rounded-lg shrink-0 cursor-pointer ring-1 ring-white/20 transition-transform hover:scale-110"
                    style={{ background: value || "#000000" }}
                    onClick={() => swatchRef.current?.click()}
                    title="Pick colour"
                />
                <input
                    ref={swatchRef}
                    type="color"
                    className="sr-only"
                    value={toHex(value)}
                    onChange={(e) => onChange(e.target.value)}
                />
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 bg-transparent text-xs outline-none font-mono min-w-0"
                    placeholder={placeholder || "#rrggbb"}
                />
            </div>
        </label>
    );
}

export default function AppEditPage() {
    const params = useParams<{ appId: string }>();
    const id = params?.appId;

    const [app, setApp] = useState<AppDoc | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const [ok, setOk] = useState("");

    const [name, setName] = useState("");
    const [domains, setDomains] = useState("");
    const [theme, setTheme] = useState({ primary: "#7C3AED", background: "#0B1220", panel: "#0B1220", text: "#FFFFFF" });
    const [copy, setCopy] = useState({ title: "Support", subtitle: "Ask anything — I'm here to help.", placeholder: "Type your question..." });
    const [enableBorder, setEnableBorder] = useState(false);
    const [borderColor, setBorderColor] = useState("rgba(255,255,255,0.12)");

    const [mdText, setMdText] = useState("");
    const [mdFileName, setMdFileName] = useState("docs.md");
    const [ingesting, setIngesting] = useState(false);

    const [mdDrawerOpen, setMdDrawerOpen] = useState(false);

    const [isDirty, setIsDirty] = useState(false);
    const savedSnapshot = useRef<string>("");

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selected, setSelected] = useState<AppDoc | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setErr("");
        fetch(`/api/apps/${id}`)
            .then((r) => r.json())
            .then((data) => {
                if (!data?.app) throw new Error(data?.error || "LOAD_FAILED");
                const a: AppDoc = data.app;
                setApp(a);
                setName(a.name || "");
                setMdText(a.kb || "");
                setDomains(domainsToText(a.allowedDomains || []));
                setTheme(a.theme || theme);
                setCopy(a.copy || copy);
                setEnableBorder(Boolean(a.enableBorder));
                setBorderColor(a.borderColor || "rgba(255,255,255,0.12)");
                savedSnapshot.current = JSON.stringify({
                    name: a.name,
                    domains: domainsToText(a.allowedDomains || []),
                    theme: a.theme,
                    copy: a.copy,
                    enableBorder: a.enableBorder,
                    borderColor: a.borderColor,
                });
                setIsDirty(false);
            })
            .catch((e) => setErr(e.message || "LOAD_FAILED"))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        const current = JSON.stringify({ name, domains, theme, copy, enableBorder, borderColor });
        setIsDirty(current !== savedSnapshot.current);
    }, [name, domains, theme, copy, enableBorder, borderColor]);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (isDirty) { e.preventDefault(); e.returnValue = ""; }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [isDirty]);

    async function deleteApp() {
        if (!selected) return;
        setDeleting(true);
        try {
            const r = await fetch(`/api/apps/${selected._id}`, { method: "DELETE" });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(data?.error || "DELETE_FAILED");
            setConfirmOpen(false);
            setSelected(null);
            setTimeout(() => { window.location.href = "/dashboard/apps"; }, 500);
        } catch (e: any) {
            alert(e.message || "DELETE_FAILED");
        } finally {
            setDeleting(false);
        }
    }

    async function onSave() {
        if (!app) return;
        setSaving(true);
        setErr("");
        setOk("");
        try {
            const r = await fetch(`/api/apps/${app._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, allowedDomains: domains, theme, copy, enableBorder, borderColor }),
            });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(data?.error || "SAVE_FAILED");
            setApp(data.app);
            setOk("Saved");
            savedSnapshot.current = JSON.stringify({ name, domains, theme, copy, enableBorder, borderColor });
            setIsDirty(false);
            setTimeout(() => setOk(""), 1200);
        } catch (e: any) {
            setErr(e.message || "SAVE_FAILED");
        } finally {
            setSaving(false);
        }
    }

    async function onIngest() {
        if (!app) return;
        if (!mdText.trim()) { setErr("Paste Markdown or upload a file first."); return; }
        setIngesting(true);
        setErr("");
        setOk("");
        try {
            const r = await fetch(`/api/kb/ingest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: mdFileName, content: mdText, appKey: app.appKey }),
            });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(data?.error || "INGEST_FAILED");
            toast.success(`KB updated successfully`);
            const rr = await fetch(`/api/apps/${app._id}`);
            const dd = await rr.json();
            if (dd?.app) setApp(dd.app);
        } catch (e: any) {
            setErr(e.message || "INGEST_FAILED");
        } finally {
            setIngesting(false);
            setTimeout(() => setOk(""), 1600);
        }
    }

    function onMdFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        setMdFileName(f.name);
        const reader = new FileReader();
        reader.onload = () => setMdText(String(reader.result || ""));
        reader.readAsText(f);
    }

    function copyAppKey() {
        navigator.clipboard.writeText(app!.appKey);
        toast.success("App key copied!");
    }

    const kbWords = mdText.trim() ? mdText.trim().split(/\s+/).length : 0;
    const kbChars = mdText.length;

    if (loading) return <div className="h-80 flex flex-col tracking-wide items-center justify-center gap-4 text-3xl text-white/70">
        <BiLoader className="text-6xl animate-spin" />
        Loading App Please Wait...
    </div>;

    if (err && !app) {
        return (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {err}
            </div>
        );
    }
    if (!app) return null;

    return (
        <>
            <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="text-lg font-bold truncate">{app.name}</div>
                            {isDirty && (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                    <AlertCircle className="h-3 w-3" /> Unsaved
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                            appKey: <span className="font-mono text-white/80">{app.appKey}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/apps/${app._id}/setup?appKey=${encodeURIComponent(app.appKey)}`} className="text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                            <IoBuild className="h-4 w-4 inline -mt-0.5 mr-1" /> Setup
                        </Link>
                        <button onClick={copyAppKey} className="text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                            <Copy className="h-4 w-4 inline -mt-0.5 mr-1" /> Copy
                        </button>
                        <button onClick={onSave} disabled={saving} className="text-xs px-3 py-2 rounded-xl bg-white/10 text-green-300 border border-green-300 font-bold disabled:opacity-60">
                            <Save className="h-4 w-4 inline -mt-0.5 mr-1" />
                            {saving ? "Saving…" : "Save"}
                        </button>
                        <button
                            onClick={() => { setSelected(app); setConfirmOpen(true); }}
                            disabled={saving}
                            className="text-xs px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 hover:bg-red-500/20 disabled:opacity-60"
                        >
                            <Trash2 className="h-4 w-4 inline -mt-0.5 mr-1" /> Delete
                        </button>
                    </div>
                </div>

                {(err || ok) && (
                    <div className={`rounded-2xl border px-4 py-3 text-sm ${err ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-green-500/40 bg-green-500/10 text-green-200"}`}>
                        {err || ok}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                        <div className="font-bold text-sm">Basics</div>
                        <div className="space-y-1">
                            <div className="text-xs text-white/60">App name</div>
                            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-11 rounded-xl bg-black/30 border border-white/10 px-3 text-sm outline-none" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-white/60">Allowed domains</div>
                            <textarea
                                value={domains}
                                onChange={(e) => setDomains(e.target.value)}
                                onBlur={(e) => setDomains(cleanDomain(e.target.value))}
                                className="w-full min-h-21.5 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none"
                                placeholder="example.com, app.example.com, localhost"
                            />
                            <div className="text-[11px] text-white/40">Paste full URLs — we'll strip http/https and paths on blur.</div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                        <div className="font-bold text-sm">Appearance</div>
                        <div className="grid grid-cols-2 gap-3">
                            {(["primary", "background", "panel", "text"] as const).map((k) => (
                                <ColorInput key={k} label={k} value={(theme as any)[k] || ""} onChange={(v) => setTheme((p) => ({ ...p, [k]: v }))} />
                            ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <input type="checkbox" checked={enableBorder} onChange={(e) => setEnableBorder(e.target.checked)} className="h-4 w-4" />
                            <div className="text-sm">Enable border</div>
                            <div className="ml-auto w-55">
                                <ColorInput label="" value={borderColor} onChange={setBorderColor} placeholder="rgba(255,255,255,0.12)" />
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                            <div className="text-xs text-white/60 mb-2">Preview</div>
                            <div
                                className="rounded-2xl p-3 transition-all duration-200"
                                style={{ background: theme.background, color: theme.text, border: enableBorder ? `1px solid ${borderColor}` : undefined }}
                            >
                                <div className="text-sm font-bold">{copy.title}</div>
                                <div className="text-xs opacity-70">{copy.subtitle}</div>
                                <div className="mt-3 flex gap-2">
                                    <div className="flex-1 h-9 rounded-xl bg-black/20 border border-white/10" />
                                    <div className="h-9 px-4 rounded-xl transition-colors duration-200" style={{ background: theme.primary }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                        <div className="font-bold text-sm">Widget Copy</div>
                        <div className="flex flex-col gap-3">
                            <label className="space-y-1">
                                <div className="text-xs ml-1 text-white/60">Title</div>
                                <input value={copy.title} onChange={(e) => setCopy((p) => ({ ...p, title: e.target.value }))} className="w-full h-10 rounded-xl bg-black/30 border border-white/10 px-3 text-sm outline-none" />
                            </label>
                            <label className="space-y-1">
                                <div className="text-xs ml-1 text-white/60">Subtitle</div>
                                <input value={copy.subtitle} onChange={(e) => setCopy((p) => ({ ...p, subtitle: e.target.value }))} className="w-full h-10 rounded-xl bg-black/30 border border-white/10 px-3 text-sm outline-none" />
                            </label>
                            <label className="space-y-1">
                                <div className="text-xs ml-1 text-white/60">Input placeholder</div>
                                <input value={copy.placeholder} onChange={(e) => setCopy((p) => ({ ...p, placeholder: e.target.value }))} className="w-full h-10 rounded-xl bg-black/30 border border-white/10 px-3 text-sm outline-none" />
                            </label>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="font-bold text-sm">Knowledge Base (Markdown)</div>
                            {mdText.trim() && (
                                <span className="text-[11px] text-white/40 font-mono">
                                    {kbWords.toLocaleString()} words · {kbChars.toLocaleString()} chars
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <div className="text-xs text-white/60">Upload .md or paste Markdown</div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setMdDrawerOpen(true)}
                                    disabled={!mdText.trim()}
                                    title={mdText.trim() ? "Open split preview" : "Add some Markdown first"}
                                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer"
                                >
                                    <ScanEye className="h-3.5 w-3.5" />
                                    Preview MD
                                </button>

                                <label className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer">
                                    <Upload className="h-3.5 w-3.5" />
                                    Upload file
                                    <input type="file" accept=".md,text/markdown,text/plain" className="hidden" onChange={onMdFile} />
                                </label>
                            </div>
                        </div>

                        <textarea
                            value={mdText}
                            onChange={(e) => setMdText(e.target.value)}
                            className="w-full min-h-40 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none font-mono"
                            placeholder={"# FAQ\n...\n\n# Refund policy\n..."}
                        />

                        <div className="flex items-center gap-2">
                            <input value={mdFileName} onChange={(e) => setMdFileName(e.target.value)} className="flex-1 h-10 rounded-xl bg-black/30 border border-white/10 px-3 text-xs outline-none font-mono" />
                            <button onClick={onIngest} disabled={ingesting || !mdText.trim()} className="h-10 px-4 rounded-xl bg-white text-black font-bold text-sm disabled:opacity-60">
                                {ingesting ? "Saving…" : "Save KB"}
                            </button>
                        </div>
                    </div>
                </div>

                <ConfirmModal
                    open={confirmOpen}
                    title="Delete app?"
                    description={`This will delete "${selected?.name}". You can't undo this.`}
                    confirmText="Delete"
                    loading={deleting}
                    onClose={() => { if (!deleting) setConfirmOpen(false); }}
                    onConfirm={deleteApp}
                />
            </div>

            <MdPreviewDrawer
                open={mdDrawerOpen}
                value={mdText}
                onChange={setMdText}
                onClose={() => setMdDrawerOpen(false)}
                fileName={mdFileName}
            />
        </>
    );
}