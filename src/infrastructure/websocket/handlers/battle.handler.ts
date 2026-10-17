import {RawData} from "ws";
import * as streamingProto from "../../../contracts/proto/streaming";

import logger from "@shared/logger";
import {extractTrackId, type MessageLogger} from "@shared/elastic";
import WebsocketClientHandlerInterface from "../interfaces/websocket-client-handler.interface";
import BattleProtoMapper from "../../grpc/mappers/battle.proto.mapper";
import BattleUpdtedUseCaseInterface from "./battle-updted-use-case-interface";
import {BATTLE_WS_ROUTE} from "../websocket.constants";

export class BattleHandler implements WebsocketClientHandlerInterface {
    constructor(
        private readonly battleUpdatedUseCaae: BattleUpdtedUseCaseInterface,
        private readonly messageLogger?: MessageLogger,
    ) {
    }

    async handle(data: RawData): Promise<void> {
        try {
            const buffer = new Uint8Array(data as ArrayBuffer);
            const message = streamingProto.BattleResponse.decode(buffer);
            // logger.log("📩 Got response:", message);
            if (!message.battle) {
                return;
            }

            void this.messageLogger?.logIn(
                'websocket',
                BATTLE_WS_ROUTE,
                message,
                extractTrackId(message),
            );

            const battle = BattleProtoMapper.toDomain(message.battle);
            await this.battleUpdatedUseCaae.execute(battle);
        } catch (err) {
            logger.error("❌ Failed to parse message:", err);
        }

    }
}

export default BattleHandler;
