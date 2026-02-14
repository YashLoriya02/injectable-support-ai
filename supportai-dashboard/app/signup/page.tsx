"use client";

import { signIn } from "next-auth/react";
import React, { useState } from "react";
import { FaGoogle } from "react-icons/fa";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [ok, setOk] = useState(false);
    const [err, setErr] = useState("");

    async function onSignup(e: React.FormEvent) {
        e.preventDefault();
        setErr("");
        setOk(false);
        setLoading(true);

        try {
            const r = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(data?.error || "SIGNUP_FAILED");

            setOk(true);
            setName("")
            setEmail("")
            setPassword("")
        } catch (e: any) {
            setErr(e.message || "SIGNUP_FAILED");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-xl font-bold">Create account</div>
                <div className="text-sm text-white/60 mt-1">
                    We'll send a verification link to your email.
                </div>

                {err && (
                    <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                        {err === "EMAIL_ALREADY_EXISTS"
                            ? "This email is already registered."
                            : err}
                    </div>
                )}

                {ok && (
                    <div className="mt-3 rounded-xl border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                        Account created! Check your inbox for the verification link.
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

                {/* Divider */}
                <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-xs text-white/50">or</span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                <form onSubmit={onSignup} className="space-y-3 mt-4">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name (optional)"
                        className="w-full h-11 rounded-xl bg-black/30 border border-white/10 px-3 text-sm outline-none"
                    />
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full h-11 rounded-xl bg-black/30 border border-white/10 px-3 text-sm outline-none"
                    />
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password (min 6)"
                        type="password"
                        className="w-full h-11 rounded-xl bg-black/30 border border-white/10 px-3 text-sm outline-none"
                    />

                    <button
                        disabled={loading || !email || password.length < 6}
                        className="w-full h-11 rounded-xl bg-white text-black font-bold text-sm disabled:opacity-60"
                    >
                        {loading ? "Creating..." : "Create account"}
                    </button>
                </form>

                <div className="mt-4 text-sm text-white/70">
                    Already have an account?{" "}
                    <a className="underline" href="/login">
                        Login
                    </a>
                </div>
            </div>
        </div>
    );
}
