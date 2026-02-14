import "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id?: string;
            mongoId?: string;
        } & DefaultSession["user"];
    }
}
