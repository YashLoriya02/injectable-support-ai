import { NextResponse } from "next/server";
import { getWidgetConfig } from "@/lib/widgetConfigStore";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const appKey = (url.searchParams.get("appKey") || "").trim();

    if (!appKey) {
        return NextResponse.json(
            { error: "MISSING_APP_KEY" },
            { status: 400 }
        );
    }

    const cfg = getWidgetConfig(appKey);
    if (!cfg) {
        return NextResponse.json(
            { error: "INVALID_APP_KEY" },
            { status: 404 }
        );
    }

    const parentOrigin =
        (url.searchParams.get("parentOrigin") || "").trim() ||
        (req.headers.get("referer") ? new URL(req.headers.get("referer")!).origin : "");

    const parentHost = parentOrigin ? new URL(parentOrigin).hostname : "";

    if (!parentHost) {
        return NextResponse.json(
            { error: "MISSING_PARENT_ORIGIN" },
            { status: 400 }
        );
    }

    const allowed = cfg.allowedDomains.includes(parentHost);

    if (!allowed) {
        return NextResponse.json(
            {
                error: "DOMAIN_NOT_ALLOWED",
                parentHost,
                allowedDomains: cfg.allowedDomains,
            },
            { status: 403 }
        );
    }

    return NextResponse.json({
        theme: cfg.theme,
        copy: cfg.copy,
        enableBorder: cfg.enableBorder,
        borderColor: cfg.borderColor,
    });
}
