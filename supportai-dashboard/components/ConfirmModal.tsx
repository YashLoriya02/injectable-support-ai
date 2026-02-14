"use client";

export default function ConfirmModal({
    open,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    loading,
    onClose,
    onConfirm,
}: {
    open: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative w-[92vw] max-w-md rounded-2xl border border-white/10 bg-[#0B1220] p-4 shadow-2xl">
                <div className="text-base font-bold">{title}</div>
                {description && <div className="mt-1 text-sm text-white/70">{description}</div>}

                <div className="mt-4 flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="h-10 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="h-10 px-4 rounded-xl border border-red-500 text-red-500 hover:text-white hover:bg-red-600 text-sm font-bold disabled:opacity-60"
                    >
                        {loading ? "Please wait..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
