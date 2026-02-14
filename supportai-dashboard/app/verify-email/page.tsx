"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");
    const [err, setErr] = useState("");

    useEffect(() => {
        const token = sp.get("token") || "";
        const email = sp.get("email") || "";
        if (!token || !email) {
            setStatus("err");
            setErr("Missing token/email.");
            return;
        }

        fetch("/api/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, email }),
        })
            .then(async (r) => {
                const data = await r.json().catch(() => ({}));
                if (!r.ok) throw new Error(data?.error || "VERIFY_FAILED");
                setStatus("ok");
                setTimeout(() => router.push("/login"), 900);
            })
            .catch((e) => {
                setStatus("err");
                setErr(e.message || "VERIFY_FAILED");
            });
    }, [sp, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
            <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-lg font-bold">Verify Email</div>

                {status === "loading" && <p className="mt-2 text-white/70">Verifying…</p>}
                {status === "ok" && <p className="mt-2 text-green-400">Verified! Redirecting to login…</p>}
                {status === "err" && <p className="mt-2 text-red-400">Failed: {err}</p>}
            </div>
        </div>
    );
}
