import {RawData} from "ws";
import {WebsocketMessageDirection} from "@prisma/client";
import * as streamingProto from "../../../contracts/proto/streaming";

import logger from "@shared/logger";
import WebsocketClientHandlerInterface from "../interfaces/websocket-client-handler.interface";
import BattleProtoMapper from "../../grpc/mappers/battle.proto.mapper";
import BattleUpdtedUseCaseInterface from "./battle-updted-use-case-interface";
import WebsocketMessageRepositoryInterface from "../../db/repositories/interfaces/websocket-message-repository.interface";
import {battleResponseInfo} from "../mappers/websocket-message.mapper";

export class BattleHandler implements WebsocketClientHandlerInterface {
    constructor(
        private readonly battleUpdatedUseCaae: BattleUpdtedUseCaseInterface,
        private readonly websocketMessageRepository: WebsocketMessageRepositoryInterface,
    ) {
    }

    async handle(data: RawData): Promise<void> {
        try {
            const buffer = new Uint8Array(data as ArrayBuffer);
            const message = streamingProto.BattleResponse.decode(buffer);
            const {type, battleId} = battleResponseInfo(message);
            const inReplyToId = await this.websocketMessageRepository.save(WebsocketMessageDirection.received, battleId, type, JSON.stringify(message));
            // logger.log("📩 Got response:", message);
            if (!message.battle) {
                return;
            }
            const battle = BattleProtoMapper.toDomain(message.battle);
            await this.battleUpdatedUseCaae.execute(battle, inReplyToId);
        } catch (err) {
            logger.error("❌ Failed to parse message:", err);
        }

    }
}

export default BattleHandler;
