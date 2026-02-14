"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, X } from "lucide-react";

export default function LogoutButton() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        try {
            setLoading(true);
            await signOut({
                callbackUrl: "/login",
            });
        } catch (e) {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold
                   bg-white/5 border border-white/10 hover:bg-white/10
                   transition-all duration-200 text-white"
            >
                <LogOut className="h-4 w-4" />
                Logout
            </button>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/10 backdrop-blur-sm p-4">
                    <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#1c1d26] shadow-2xl">

                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                            <h2 className="text-lg font-bold text-white">
                                Confirm Logout
                            </h2>

                            <button
                                onClick={() => setOpen(false)}
                                className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 
                           hover:bg-white/10 flex items-center justify-center transition"
                            >
                                <X className="h-4 w-4 text-white" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-5 py-5">
                            <p className="text-sm text-white/70 leading-relaxed">
                                Are you sure you want to sign out of your dashboard?
                                <br />
                                <span className="text-white/50 text-xs">
                                    You’ll need to log in again to access your apps and analytics.
                                </span>
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-5 pb-5">
                            <button
                                onClick={() => setOpen(false)}
                                disabled={loading}
                                className="flex-1 rounded-xl border border-white/10 bg-white/5hover:bg-white/10 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleLogout}
                                disabled={loading}
                                className="flex-1 rounded-xl bg-purple-500/70 hover:brightness-110 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Signing out...
                                    </>
                                ) : (
                                    "Logout"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
