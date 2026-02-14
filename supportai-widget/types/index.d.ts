export type RemoteConfig = {
    theme: { primary: string; background: string; panel: string; text: string };
    copy: { title: string; subtitle: string; placeholder: string };
    enableBorder?: boolean;
    borderColor?: string;
};

export type ChatMsg = {
    id: string;
    role: "user" | "bot";
    text: string;
    ts: number;
};

export type AppKB = {
    chunks: KBChunk[];
    updatedAt: number;
};

export type KBChunk = {
    id: string;
    title: string;
    text: string;
};

export type IncomingMsg = {
    id?: string;
    role: "user" | "bot";
    text: string;
    ts?: number;
};
