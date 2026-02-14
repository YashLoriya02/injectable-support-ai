"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { FaGoogle } from "react-icons/fa";

export default function LoginPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const next = sp.get("next") || "/dashboard";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    async function onCredLogin(e: React.FormEvent) {
        e.preventDefault();
        setErr("");
        setLoading(true);

        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (!res?.ok) {
            // NextAuth returns generic errors; we still show what we can
            setErr(res?.error || "Login failed");
            return;
        }

        router.push(next);
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-xl font-bold">Login</div>
                <div className="text-sm text-white/60 mt-1">
                    Use email/password or Google
                </div>

                {err && (
                    <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                        {err === "EMAIL_NOT_VERIFIED"
                            ? "Please verify your email first. Check your inbox."
                            : err}
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                    className="w-full my-3 h-11 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10
                   text-white font-semibold text-sm flex items-center justify-center gap-3
                   transition"
                >
                    <FaGoogle className="h-4 w-4" />
                    Continue with Google
                </button>

                <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <div className="text-xs text-white/50">OR</div>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                <form onSubmit={onCredLogin} className="space-y-3">
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full h-11 rounded-xl bg-black/30 border border-white/10 px-3 text-sm outline-none"
                    />
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        type="password"
                        className="w-full h-11 rounded-xl bg-black/30 border border-white/10 px-3 text-sm outline-none"
                    />

                    <button
                        disabled={loading || !email || !password}
                        className="w-full h-11 rounded-xl bg-white text-black font-bold text-sm disabled:opacity-60"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="mt-4 text-sm text-white/70">
                    New here?{" "}
                    <a className="underline" href="/signup">
                        Create account
                    </a>
                </div>
            </div>
        </div>
    );
}
