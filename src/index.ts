import { handleStream } from "./streamer";

export interface Env {
    SESSIONS: KVNamespace;
    FILE_MAP: KVNamespace;
    API_ID: string;
    API_HASH: string;
    BOT_TOKEN: string;
    WORKER_URL: string;
    BIN_CHANNEL?: string;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        try {
            const url = new URL(request.url);
            const botPath = "/bot" + env.BOT_TOKEN;

            if (url.pathname === "/" || url.pathname === "/status") {
                return new Response("Bot Active.", { status: 200 });
            }

            // Bot Webhook Handler
            if (request.method === "POST" && (url.pathname === botPath || url.pathname.includes(env.BOT_TOKEN))) {
                const update = await request.json() as any;
                const message = update.message || update.edited_message;
                if (!message) return new Response("OK");

                const chatId = message.chat.id;
                const messageId = message.message_id;
                const apiUrl = "https://api.telegram.org/bot" + env.BOT_TOKEN;

                if (message.text === "/start") {
                    await fetch(apiUrl + "/sendMessage", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: "send me file i will generate link!",
                        })
                    });
                    return new Response("OK");
                }

                const media = message.document || message.video || message.audio;
                if (media) {
                    const fileId = media.file_id;
                    const fileName = media.file_name || "file";
                    const baseUrl = new URL(env.WORKER_URL).origin;

                    const directLink = `${baseUrl}/dl/${fileId}?name=${encodeURIComponent(fileName)}`;

                    ctx.waitUntil((async () => {
                        if (env.BIN_CHANNEL) {
                            const fRes = await fetch(apiUrl + "/copyMessage", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ chat_id: env.BIN_CHANNEL, from_chat_id: chatId, message_id: messageId })
                            });
                            const fData = await fRes.json() as any;
                            if (fData.ok) {
                                await env.FILE_MAP.put(fileId, JSON.stringify({
                                    cid: env.BIN_CHANNEL,
                                    mid: fData.result.message_id,
                                    size: media.file_size
                                }));
                            }
                        }
                    })());

                    await fetch(apiUrl + "/sendMessage", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: `Direct Link:\n${directLink}`,
                            reply_to_message_id: messageId,
                        })
                    });
                }
                return new Response("OK");
            }

            if (url.pathname.startsWith("/dl/")) {
                return await handleStream(request, env);
            }

            return new Response("Not Found", { status: 404 });

        } catch (e: any) {
            return new Response("Worker Error: " + e.message, { status: 500 });
        }
    },
};
