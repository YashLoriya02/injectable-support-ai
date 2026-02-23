export type WidgetConfig = {
    appKey: string;
    allowedDomains: string[];
    enableBorder?: boolean;
    borderColor?: string;
    theme: {
        primary: string;
        background: string;
        panel: string;
        text: string;
    };
    copy: {
        title: string;
        subtitle: string;
        placeholder: string;
    };
};

import { AppModel } from "./models/App";

export async function getWidgetConfig(appKey: string): Promise<WidgetConfig | null> {
    if (!appKey) return null;

    const app = await AppModel.findOne({ appKey })
        .select("appKey allowedDomains enableBorder borderColor theme copy")
        .lean();

    if (!app) return null;

    return {
        appKey: app.appKey,
        allowedDomains: Array.isArray(app.allowedDomains) ? app.allowedDomains : [],
        enableBorder: app.enableBorder ?? false,
        borderColor: app.borderColor ?? "rgba(255,255,255,0.12)",
        theme: {
            primary: app.theme?.primary ?? "#7C3AED",
            background: app.theme?.background ?? "#0B1220",
            panel: app.theme?.panel ?? "#0B1220",
            text: app.theme?.text ?? "#FFFFFF",
        },
        copy: {
            title: app.copy?.title ?? "Support",
            subtitle: app.copy?.subtitle ?? "Ask anything — I'm here to help.",
            placeholder: app.copy?.placeholder ?? "Type your question...",
        },
    };
}