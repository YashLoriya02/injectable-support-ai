"use client";

import React, { useEffect, useState, useMemo } from "react";
import KebabMenu from "@/components/KebabMenu";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "sonner";
import {
    Search,
    Plus,
    Globe,
    Copy,
    Settings,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    LayoutGrid,
    List,
    Zap,
    Calendar,
    AlignLeft,
    CheckCircle2,
    XCircle,
    Building,
} from "lucide-react";
import { IoBuild } from "react-icons/io5";

type AppRow = {
    appId: string;
    name: string;
    appKey: string;
    allowedDomains: string[];
    createdAt?: string;
};

type SortKey = "name" | "createdAt" | "domains";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "list";

// ── tiny helpers ─────────────────────────────────────────────────────────────

function timeAgo(iso?: string) {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

// Deterministic gradient per appKey
function appGradient(key: string) {
    const palettes = [
        ["#6366f1", "#8b5cf6"],
        ["#0ea5e9", "#6366f1"],
        ["#10b981", "#0ea5e9"],
        ["#f59e0b", "#ef4444"],
        ["#ec4899", "#8b5cf6"],
        ["#14b8a6", "#6366f1"],
        ["#f97316", "#ec4899"],
    ];
    const idx = key.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palettes.length;
    const [a, b] = palettes[idx];
    return `linear-gradient(135deg, ${a}, ${b})`;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="rounded-2xl border border-white/20 bg-white/3 p-5 space-y-4 animate-pulse">
            <div className="flex gap-3 items-center">
                <div className="h-10 w-10 rounded-xl bg-white/20" />
                <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-32 rounded bg-white/20" />
                    <div className="h-2.5 w-20 rounded bg-white/10" />
                </div>
            </div>
            <div className="flex gap-2">
                <div className="h-6 w-20 rounded-lg bg-white/10" />
                <div className="h-6 w-16 rounded-lg bg-white/10" />
            </div>
            <div className="flex gap-2 pt-1">
                <div className="h-8 w-20 rounded-xl bg-white/10" />
                <div className="h-8 w-24 rounded-xl bg-white/10" />
            </div>
        </div>
    );
}

// ── App card (grid) ───────────────────────────────────────────────────────────
function AppCard({ app, onDelete, idx }: { app: AppRow; onDelete: (a: AppRow) => void; idx: number }) {
    const grad = appGradient(app.appKey);
    const hasDomains = app.allowedDomains.length > 0;

    return (
        <div
            className="group relative rounded-2xl border border-white/10 bg-[#151518] hover:border-white/50 transition-all duration-200 overflow-hidden"
            style={{ animationDelay: `${idx * 60}ms` }}
        >
            <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div
                            className="h-10 w-10 rounded-xl shrink-0 flex items-center justify-center text-white text-base font-bold tracking-wide shadow-lg"
                            style={{ background: grad }}
                        >
                            {initials(app.name) || <Zap className="h-4 w-4" />}
                        </div>

                        <div className="flex gap-4 items-center min-w-0">
                            <div className="font-semibold text-sm text-white truncate leading-snug">
                                {app.name}
                            </div>
                            <div className="text-[11px] text-white/40 mt-0.5 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {timeAgo(app.createdAt)}
                            </div>
                        </div>
                    </div>

                    <KebabMenu
                        onEdit={() => (window.location.href = `/dashboard/apps/${app.appId}/edit`)}
                        onDelete={() => onDelete(app)}
                    />
                </div>

                {/* appKey */}
                <div className="flex items-center gap-2 rounded-xl bg-black/30 border border-white/6 px-3 py-2">
                    <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest shrink-0">app key</span>
                    <span className="font-mono text-[11px] text-white/60 truncate flex-1">{app.appKey}</span>
                    <button
                        onClick={() => { navigator.clipboard.writeText(app.appKey); toast.success("Copied!"); }}
                        className="shrink-0 text-white/30 hover:text-white/80 transition-colors"
                        title="Copy appKey"
                    >
                        <Copy className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Domains */}
                <div className="flex flex-wrap gap-1.5 min-h-7">
                    {hasDomains ? (
                        <>
                            {app.allowedDomains.slice(0, 3).map((d) => (
                                <span key={d} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-white/5 border border-white/8 text-white/60">
                                    <Globe className="h-2.5 w-2.5" />
                                    {d}
                                </span>
                            ))}
                            {app.allowedDomains.length > 3 && (
                                <span className="text-[11px] px-2 py-1 rounded-lg bg-white/3 border border-white/6 text-white/40">
                                    +{app.allowedDomains.length - 3}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400/70 px-2 py-1 rounded-lg bg-amber-400/6 border border-amber-400/12">
                            <XCircle className="h-3 w-3" />
                            No domains set
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-white/5">
                    <a
                        href={`/dashboard/apps/${app.appId}/setup?appKey=${encodeURIComponent(app.appKey)}`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl bg-white/5 border border-white/8 text-white/70 hover:bg-white/8 hover:text-white transition-all"
                    >
                        <IoBuild className="h-3.5 w-3.5" />
                        Setup
                    </a>
                    <a
                        href={`/dashboard/apps/${app.appId}/edit`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl bg-white/5 border border-white/8 text-white/70 hover:bg-white/8 hover:text-white transition-all"
                    >
                        <Settings className="h-3.5 w-3.5" />
                        Settings
                    </a>
                </div>
            </div>
        </div>
    );
}

// ── App row (list view) ───────────────────────────────────────────────────────
function AppRow({ app, onDelete, idx }: { app: AppRow; onDelete: (a: AppRow) => void; idx: number }) {
    const grad = appGradient(app.appKey);
    const hasDomains = app.allowedDomains.length > 0;

    return (
        <div
            className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-white/10 bg-[#151518] hover:border-white/50 transition-all duration-150"
            style={{ animationDelay: `${idx * 40}ms` }}
        >
            {/* Avatar */}
            <div
                className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-white text-base font-bold"
                style={{ background: grad }}
            >
                {initials(app.name) || <Zap className="h-3.5 w-3.5" />}
            </div>

            {/* Name */}
            <div className="w-40 shrink-0">
                <div className="text-sm font-medium text-white truncate">{app.name}</div>
            </div>

            {/* appKey */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="font-mono text-[11px] text-white/40 truncate">{app.appKey}</span>
                <button
                    onClick={() => { navigator.clipboard.writeText(app.appKey); toast.success("Copied!"); }}
                    className="shrink-0 text-white/20 hover:text-white/60 transition-colors"
                >
                    <Copy className="h-3 w-3" />
                </button>
            </div>

            {/* Domains */}
            <div className="w-52 shrink-0 flex flex-wrap gap-1">
                {hasDomains ? (
                    <>
                        {app.allowedDomains.slice(0, 2).map((d) => (
                            <span key={d} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 border border-white/8 text-white/50">
                                {d}
                            </span>
                        ))}
                        {app.allowedDomains.length > 2 && (
                            <span className="text-[10px] text-white/30">+{app.allowedDomains.length - 2}</span>
                        )}
                    </>
                ) : (
                    <span className="text-[10px] text-amber-400/60">No domains</span>
                )}
            </div>

            {/* Created */}
            <div className="w-24 shrink-0 text-[11px] text-white/30 text-right">{timeAgo(app.createdAt)}</div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                    href={`/dashboard/apps/${app.appId}/edit`}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/6 border border-white/8 text-white/60 hover:text-white transition-colors"
                >
                    Settings
                </a>
                <KebabMenu
                    onEdit={() => (window.location.href = `/dashboard/apps/${app.appId}/edit`)}
                    onDelete={() => onDelete(app)}
                    setup={true}
                    app={app}
                />
            </div>
        </div>
    );
}

// ── Sort button ───────────────────────────────────────────────────────────────
function SortBtn({
    label,
    icon,
    sortKey,
    current,
    dir,
    onClick,
}: {
    label: string;
    icon: React.ReactNode;
    sortKey: SortKey;
    current: SortKey;
    dir: SortDir;
    onClick: (k: SortKey) => void;
}) {
    const active = current === sortKey;
    return (
        <button
            onClick={() => onClick(sortKey)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${active
                ? "border-white/40 bg-white/10 text-white"
                : "border-white/20 bg-white/3 text-white/50 hover:text-white/80 hover:bg-white/6"
                }`}
        >
            {icon}
            {label}
            {active ? (
                dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
            ) : (
                <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
        </button>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AppsPage() {
    const [apps, setApps] = useState<AppRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selected, setSelected] = useState<AppRow | null>(null);

    // UI state
    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("createdAt");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [domainFilter, setDomainFilter] = useState<"all" | "configured" | "unconfigured">("all");

    async function load() {
        setErr("");
        setLoading(true);
        try {
            const r = await fetch("/api/apps", { cache: "no-store" });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(data?.error || "APPS_FETCH_FAILED");
            setApps(
                (data?.apps || []).map((a: any) => ({
                    appId: String(a._id || a.appId),
                    name: a.name,
                    appKey: a.appKey,
                    allowedDomains: a.allowedDomains || [],
                    createdAt: a.createdAt,
                }))
            );
        } catch (e: any) {
            setErr(e.message || "APPS_FETCH_FAILED");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function deleteApp() {
        if (!selected) return;
        setDeleting(true);
        try {
            const r = await fetch(`/api/apps/${selected.appId}`, { method: "DELETE" });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(data?.error || "DELETE_FAILED");
            setApps((prev) => prev.filter((x) => x.appId !== selected.appId));
            toast.success(`"${selected.name}" deleted`);
            setConfirmOpen(false);
            setSelected(null);
        } catch (e: any) {
            toast.error(e.message || "DELETE_FAILED");
        } finally {
            setDeleting(false);
        }
    }

    function handleSort(key: SortKey) {
        if (key === sortKey) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    }

    // ── Derived list ──────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = [...apps];

        // search
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter(
                (a) =>
                    a.name.toLowerCase().includes(q) ||
                    a.appKey.toLowerCase().includes(q) ||
                    a.allowedDomains.some((d) => d.toLowerCase().includes(q))
            );
        }

        // domain filter
        if (domainFilter === "configured") list = list.filter((a) => a.allowedDomains.length > 0);
        if (domainFilter === "unconfigured") list = list.filter((a) => a.allowedDomains.length === 0);

        // sort
        list.sort((a, b) => {
            let cmp = 0;
            if (sortKey === "name") cmp = a.name.localeCompare(b.name);
            else if (sortKey === "createdAt")
                cmp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            else if (sortKey === "domains")
                cmp = a.allowedDomains.length - b.allowedDomains.length;
            return sortDir === "asc" ? cmp : -cmp;
        });

        return list;
    }, [apps, query, sortKey, sortDir, domainFilter]);

    const totalDomains = apps.reduce((s, a) => s + a.allowedDomains.length, 0);
    const unconfigured = apps.filter((a) => a.allowedDomains.length === 0).length;

    return (
        <div className="space-y-6">
            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">Apps</h1>
                    <p className="text-sm text-white/50 mt-0.5">
                        Manage your embedded support widgets
                    </p>
                </div>

                <a
                    href="/dashboard/apps/new"
                    className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-white text-black font-bold hover:opacity-90 transition-opacity shadow-lg"
                >
                    <Plus className="h-4 w-4" />
                    New App
                </a>
            </div>

            {/* ── Error ───────────────────────────────────────────────────── */}
            {err && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-300">
                    {err}
                </div>
            )}

            {/* ── Toolbar ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name, key, or domain…"
                        className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/4 border border-white/20 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/20 focus:bg-white/6 transition-all"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Domain filter pills */}
                <div className="flex gap-1.5">
                    {(["all", "configured", "unconfigured"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setDomainFilter(f)}
                            className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-all ${domainFilter === f
                                ? "bg-white/10 border-white/40 text-white"
                                : "bg-white/3 border-white/20 text-white/45 hover:text-white/70"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Sort */}
                <SortBtn label="Name" icon={<AlignLeft className="h-3 w-3" />} sortKey="name" current={sortKey} dir={sortDir} onClick={handleSort} />
                <SortBtn label="Date" icon={<Calendar className="h-3 w-3" />} sortKey="createdAt" current={sortKey} dir={sortDir} onClick={handleSort} />
                <SortBtn label="Domains" icon={<Globe className="h-3 w-3" />} sortKey="domains" current={sortKey} dir={sortDir} onClick={handleSort} />

                <div className="flex rounded-lg border border-white/20 bg-white/3 p-0.5 gap-0.5 ml-auto">
                    {(["grid", "list"] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setViewMode(v)}
                            className={`p-1.5 rounded-md transition-all ${viewMode === v ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
                                }`}
                        >
                            {v === "grid" ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Result count ────────────────────────────────────────────── */}
            {!loading && (query || domainFilter !== "all") && (
                <div className="text-xs text-white/35">
                    {filtered.length === 0
                        ? "No apps match your filters."
                        : `${filtered.length} of ${apps.length} app${apps.length !== 1 ? "s" : ""}`}
                </div>
            )}

            {/* ── Content ─────────────────────────────────────────────────── */}
            {loading ? (
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-5" : "space-y-2"}>
                    {[1, 2, 3].map((n) =>
                        viewMode === "grid" ? (
                            <SkeletonCard key={n} />
                        ) : (
                            <div key={n} className="h-14 rounded-xl border border-white/6 bg-white/2 animate-pulse" />
                        )
                    )}
                </div>
            ) : apps.length === 0 ? (
                /* ── Empty state ── */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4">
                        <Zap className="h-7 w-7 text-white/20" />
                    </div>
                    <div className="text-base font-semibold text-white/70 mb-1">No apps yet</div>
                    <div className="text-sm text-white/35 mb-6 max-w-xs">
                        Create your first app to get an embed key for your support widget.
                    </div>
                    <a
                        href="/dashboard/apps/new"
                        className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-white text-black font-bold hover:opacity-90 transition-opacity"
                    >
                        <Plus className="h-4 w-4" />
                        Create first app
                    </a>
                </div>
            ) : filtered.length === 0 ? (
                /* ── No results ── */
                <div className="py-14 text-center">
                    <div className="text-sm text-white/40 mb-2">No apps match your search.</div>
                    <button
                        onClick={() => { setQuery(""); setDomainFilter("all"); }}
                        className="text-xs text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors"
                    >
                        Clear filters
                    </button>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map((a, i) => (
                        <AppCard
                            key={a.appId}
                            app={a}
                            idx={i}
                            onDelete={(x) => { setSelected(x); setConfirmOpen(true); }}
                        />
                    ))}
                </div>
            ) : (
                /* ── List view ── */
                <div className="space-y-3">
                    {/* List header */}
                    <div className="flex items-center gap-4 px-4 py-2 text-[11px] text-white/40 uppercase tracking-widest">
                        <div className="w-8 shrink-0" />
                        <div className="w-40 shrink-0">Name</div>
                        <div className="flex-1">App Key</div>
                        <div className="w-52 shrink-0">Domains</div>
                        <div className="w-24 shrink-0 text-right">Created</div>
                        <div className="w-20" />
                    </div>
                    {filtered.map((a, i) => (
                        <AppRow
                            key={a.appId}
                            app={a}
                            idx={i}
                            onDelete={(x) => { setSelected(x); setConfirmOpen(true); }}
                        />
                    ))}
                </div>
            )}

            <ConfirmModal
                open={confirmOpen}
                title="Delete app?"
                description={`This will permanently delete "${selected?.name}" and its knowledge base. This cannot be undone.`}
                confirmText="Delete"
                loading={deleting}
                onClose={() => { if (!deleting) setConfirmOpen(false); }}
                onConfirm={deleteApp}
            />
        </div>
    );
}