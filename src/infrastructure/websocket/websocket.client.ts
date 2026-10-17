import WebSocket from "ws";
import * as streamingProto from "../../contracts/proto/streaming";
import logger from "@shared/logger";
import {extractTrackId, type MessageLogger} from "@shared/elastic";
import WebsocketClientConfig from "./types/websocket-client-config";
import WebsocketClientHandlerInterface from "./interfaces/websocket-client-handler.interface";
import AuthService from "../auth/service";
import ProfileService from "../profile/service";
import {BATTLE_WS_ROUTE} from "./websocket.constants";

class WebsocketClient {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private reconnectFn: NodeJS.Timeout | null = null;

    constructor(
        private readonly authService: AuthService,
        private readonly profileService: ProfileService,
        private readonly websocketClientConfig: WebsocketClientConfig,
        private readonly websocketClientHandler: WebsocketClientHandlerInterface,
        private readonly messageLogger?: MessageLogger,
    ) {
    }

    async getWs(): Promise<WebSocket | null> {
        if (
            this.ws &&
            this.ws.readyState === WebSocket.OPEN
        ) {
            return this.ws;
        }


        if (!this.reconnectFn) {
            this.scheduleReconnect();
        }

        return null;
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    async connect(): Promise<WebSocket> {
        this.authService.ensureAuthenticated();
        const accessToken = this.authService.accessToken;
        const profileEntity = await this.profileService.fetchProfile();
        const profileId = profileEntity.id;

        const url = `ws://${this.websocketClientConfig.sererUrl}/battle?token=${accessToken.value}&profileId=${profileId.value}`;

        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(url);

            this.ws.on("message", (message: any) =>
                this.websocketClientHandler.handle(message)
            );

            this.ws.on("open", () => {
                // logger.info("Battle stream was connected");
                resolve(this.ws!);
            });

            this.ws.on("error", (error) => {
                this.errorHandler(error);
                reject(error);
            });

            this.ws.on("close", this.closeHandler);
        });
    }

    disconnect(): void {
        if (!this.ws) {
            return;
        }

        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
        } else if (this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.terminate();
        }

        this.ws.removeAllListeners();
        this.ws = null;

        this.cancelReconnect();
    }

    send = async (message: streamingProto.BattleRequest): Promise<void> => {
        const ws = await this.getWs();
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.error("⚠️ WebSocket not ready:", ws?.readyState);
            return;
        }

        try {
            void this.messageLogger?.logOut(
                'websocket',
                BATTLE_WS_ROUTE,
                message,
                extractTrackId(message),
            );

            // logger.log(message);
            ws.send(streamingProto.BattleRequest.encode(message).finish());
        } catch (err) {
            logger.error("Failed to send BattleRequest", err);
            throw err;
        }
    };

    cancelReconnect(reconnectAttempts = 0) {
        // logger.info("⏹️ Reconnect cancelled");

        this.reconnectAttempts = reconnectAttempts;
        if (this.reconnectFn) {
            clearTimeout(this.reconnectFn);
        }
        this.reconnectFn = null;
    }

    private errorHandler = (err: unknown) => {
        logger.error("⚠️ WebSocket error:", err);
        this.scheduleReconnect();
    }

    private openHandler = () => {
        this.cancelReconnect();
        logger.info("✅ WebSocket connected");
    };

    private closeHandler = () => {
        logger.warn("❌ Connection closed");
        this.scheduleReconnect();
    };

    private scheduleReconnect(): void {
        if (this.reconnectFn) {
            return;
        }

        const delay = 1000;
        // const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);

        logger.info(`Schedule reconnect in ${delay / 1000}s`);

        this.reconnectAttempts++;

        this.reconnectFn = setTimeout(async () => {
            this.reconnectFn = null;

            logger.info(
                `🔄 Reconnecting... attempt ${this.reconnectAttempts}`,
            );

            try {
                await this.connect();
            } catch (err) {
                logger.error("Reconnect failed:", err);
                this.scheduleReconnect();
            }
        }, delay);
    }
}


export default WebsocketClient;
