"use client";

import React, { useEffect, useState } from "react";
import KebabMenu from "@/components/KebabMenu";
import ConfirmModal from "@/components/ConfirmModal";

type AppRow = {
    appId: string;
    name: string;
    appKey: string;
    allowedDomains: string[];
    createdAt?: string;
};

export default function AppsPage() {
    const [apps, setApps] = useState<AppRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selected, setSelected] = useState<AppRow | null>(null);

    async function load() {
        setErr("");
        setLoading(true);
        try {
            const r = await fetch("/api/apps", { cache: "no-store" });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(data?.error || "APPS_FETCH_FAILED");
            setApps((data?.apps || []).map((a: any) => ({
                appId: String(a._id || a.appId),
                name: a.name,
                appKey: a.appKey,
                allowedDomains: a.allowedDomains || [],
                createdAt: a.createdAt,
            })));
        } catch (e: any) {
            setErr(e.message || "APPS_FETCH_FAILED");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function deleteApp() {
        if (!selected) return;
        setDeleting(true);
        try {
            const r = await fetch(`/api/apps/${selected.appId}`, { method: "DELETE" });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(data?.error || "DELETE_FAILED");

            setApps((prev) => prev.filter((x) => x.appId !== selected.appId));
            setConfirmOpen(false);
            setSelected(null);
        } catch (e: any) {
            alert(e.message || "DELETE_FAILED");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-lg font-bold">Apps</div>
                    <div className="text-sm text-white/60">
                        Create an app to get your embed code.
                    </div>
                </div>

                <a
                    href="/dashboard/apps/new"
                    className="text-sm px-4 py-2 rounded-xl bg-white text-black font-bold hover:opacity-90"
                >
                    + New App
                </a>
            </div>

            {err && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {err}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {loading ? (
                    <>
                        <div className="h-28 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                        <div className="h-28 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                    </>
                ) : apps.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                        No apps yet. Create your first one.
                    </div>
                ) : (
                    apps.map((a) => (
                        <div
                            key={a.appId}
                            className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.07] transition"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="font-bold text-base truncate">{a.name}</div>
                                    <div className="mt-1 text-xs text-white/60">
                                        appKey: <span className="font-mono text-white/80">{a.appKey}</span>
                                    </div>
                                </div>

                                <KebabMenu
                                    onEdit={() => (window.location.href = `/dashboard/apps/${a.appId}/edit`)}
                                    onDelete={() => {
                                        setSelected(a);
                                        setConfirmOpen(true);
                                    }}
                                />
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {(a.allowedDomains || []).slice(0, 4).map((d) => (
                                    <span
                                        key={d}
                                        className="text-xs px-2 py-1 rounded-lg border border-white/10 bg-black/20 text-white/80"
                                    >
                                        {d}
                                    </span>
                                ))}
                                {(a.allowedDomains || []).length > 4 && (
                                    <span className="text-xs text-white/50">
                                        +{(a.allowedDomains || []).length - 4} more
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 flex gap-2">
                                <a
                                    href={`/dashboard/apps/${a.appId}/edit`}
                                    className="text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                                >
                                    Settings
                                </a>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(a.appKey);
                                        alert("Copied appKey");
                                    }}
                                    className="text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                                >
                                    Copy appKey
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ConfirmModal
                open={confirmOpen}
                title="Delete app?"
                description={`This will delete "${selected?.name}". You can’t undo this.`}
                confirmText="Delete"
                loading={deleting}
                onClose={() => {
                    if (!deleting) setConfirmOpen(false);
                }}
                onConfirm={deleteApp}
            />
        </div>
    );
}
