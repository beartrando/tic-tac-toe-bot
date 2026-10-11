import WebsocketClient from "./websocket.client";
import WebSocket from "ws";

export class WebsocketClientService {
    constructor(
        private readonly websocketClient: WebsocketClient,
    ) {
    }

    async start(): Promise<void> {
        await this.websocketClient.connect();
    }

    async stop(): Promise<void> {
        await this.websocketClient.disconnect();
    }

    async getConnection(): Promise<WebSocket> {
        const ws = await this.websocketClient.getWs();
        if (!ws) {
            throw new Error("WebSocket is not connected");
        }

        return ws;
    }

    async send(message: any, inReplyToId: string | null = null): Promise<void> {
        if (!(await this.check())) {
            throw new Error("WebSocket is not connected");
        }

        await this.websocketClient.send(message, inReplyToId);
    }

    async check(): Promise<boolean> {
        return this.websocketClient.isConnected();
    }
}

export default WebsocketClientService;
