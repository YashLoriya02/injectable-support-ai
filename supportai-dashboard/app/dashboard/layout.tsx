"use client"

import LogoutButton from "@/components/LogoutButton";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isNewAppPage = pathname === "/dashboard/apps/new" || pathname.includes("/edit") || pathname.includes("/setup");

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="border-b border-white/10 bg-white/5">
                <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
                    <a href="/">
                        <div className="font-extrabold">SupportAI Dashboard</div>
                    </a>

                    <div className="flex gap-4">
                        {
                            isNewAppPage &&
                            <Link href={"/dashboard/apps"} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 text-white"
                            >
                                All Apps
                            </Link>
                        }
                        <LogoutButton />
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
        </div>
    );
}
