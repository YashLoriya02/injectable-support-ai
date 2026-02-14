"use client";

import React, { useEffect, useRef, useState } from "react";

export default function KebabMenu({
    onEdit,
    onDelete,
}: {
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as any)) setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((s) => !s)}
                className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center"
                aria-label="Menu"
            >
                <span className="text-lg leading-none">⋯</span>
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-30 rounded-xl border border-white/10 bg-[#1F2029] shadow-xl overflow-hidden">
                    <button
                        onClick={() => {
                            setOpen(false);
                            onEdit();
                        }}
                        className="w-full border-b border-white/20 px-3 py-2 text-left text-sm hover:bg-white/10"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => {
                            setOpen(false);
                            onDelete();
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 text-red-300"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
