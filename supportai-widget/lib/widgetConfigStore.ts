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

const CONFIGS: Record<string, WidgetConfig> = {
    "appkey@123": {
        appKey: "appkey@123",
        // enableBorder: true,
        // borderColor: "white",
        allowedDomains: ["localhost", "127.0.0.1"],
        theme: {
            primary: "#7C3AED",
            background: "#0B1220",
            panel: "#0B1220",
            text: "#FFFFFF",
        },
        copy: {
            title: "Support AI",
            subtitle: "Ask me anything about the product",
            placeholder: "Type your question…",
        },
    },
};

export function getWidgetConfig(appKey: string): WidgetConfig | null {
    return CONFIGS[appKey] ?? null;
}
