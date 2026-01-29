import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import bigInt from "big-integer";
import { Buffer } from "node:buffer";

/**
 * v2.0 CLASSIC MTPROTO (REVERTED)
 * Standard GramJS / WASM implementation.
 * Pure proxy path for all files.
 */

let globalClient: TelegramClient | null = null;
let clientPromise: Promise<TelegramClient> | null = null;

function toBuffer(data: any): Buffer {
    if (data?.type === "Buffer" && Array.isArray(data.data)) return Buffer.from(data.data);
    return Buffer.from(data);
}

async function getConnectedClient(env: any, dcId?: number): Promise<TelegramClient> {
    if (globalClient && globalClient.connected) return globalClient;
    if (clientPromise) return clientPromise;

    clientPromise = (async () => {
        const sessionKey = "session:gramjs:" + env.BOT_TOKEN;
        const savedSession = await env.SESSIONS.get(sessionKey);

        const client = new TelegramClient(new StringSession(savedSession || ""), Number(env.API_ID), env.API_HASH, {
            connectionRetries: 15,
            useWSS: true,
            dcId: dcId ? Number(dcId) : undefined,
            maxConcurrentDownloads: 10,
            autoReconnect: true
        } as any);

        client.setLogLevel("none" as any);
        if (savedSession) {
            await client.connect();
        } else {
            await client.start({ botAuthToken: env.BOT_TOKEN });
            await env.SESSIONS.put(sessionKey, (client.session as StringSession).save());
        }
        globalClient = client;
        return client;
    })();

    try {
        return await clientPromise;
    } finally {
        clientPromise = null;
    }
}

export async function handleStream(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const fileId = url.pathname.split("/").pop();
    if (!fileId) return new Response("ID Missing", { status: 400 });

    const fileName = url.searchParams.get("name") || "file";

    try {
        const mappingStr = await env.FILE_MAP.get(fileId);
        if (!mappingStr) return new Response("Link Expired.", { status: 404 });
        const mapping = JSON.parse(mappingStr);
        let { cid, mid, dcId, doc } = mapping;

        const client = await getConnectedClient(env, dcId);

        if (!doc) {
            const messages = await client.getMessages(cid, { ids: [mid] });
            const media = messages?.[0]?.media as any;
            if (!media || !media.document) return new Response("File not found.", { status: 404 });
            doc = media.document;
            await env.FILE_MAP.put(fileId, JSON.stringify({ ...mapping, dcId: doc.dcId || doc.dc_id, doc }));
        }

        const totalSize = Number(doc.size);
        const rangeHeader = request.headers.get("Range");

        let start = 0, end = totalSize - 1;
        if (rangeHeader) {
            const parts = rangeHeader.replace(/bytes=/, "").split("-");
            start = parseInt(parts[0], 10);
            if (parts[1]) end = parseInt(parts[1], 10);
            if (isNaN(start)) start = 0;
            if (isNaN(end)) end = totalSize - 1;
        }

        const contentLength = end - start + 1;

        const iterator = client.iterDownload({
            file: new Api.InputDocumentFileLocation({
                id: bigInt(doc.id) as any,
                accessHash: bigInt(doc.accessHash) as any,
                fileReference: toBuffer(doc.fileReference) as any,
                thumbSize: ""
            }),
            offset: bigInt(start) as any,
            limit: bigInt(contentLength) as any,
            requestSize: 128 * 1024,
            chunkSize: 128 * 1024,
        });

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of iterator) {
                        if (chunk && chunk.length > 0) {
                            controller.enqueue(new Uint8Array(chunk));
                            // Micro-yield to reset CPU budget
                            await new Promise(r => setTimeout(r, 0));
                        }
                    }
                    controller.close();
                } catch (e) {
                    try { controller.close(); } catch { }
                }
            }
        });

        const headers: Record<string, string> = {
            "Content-Type": doc.mimeType || "application/octet-stream",
            "Accept-Ranges": "bytes",
            "Content-Length": String(contentLength),
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "Content-Range, Content-Length, Content-Type",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`
        };

        if (rangeHeader) {
            headers["Content-Range"] = `bytes ${start}-${end}/${totalSize}`;
            return new Response(stream, { status: 206, headers });
        } else {
            return new Response(stream, { status: 200, headers });
        }

    } catch (error: any) {
        return new Response("Streaming Error: " + error.message, { status: 500 });
    }
}
