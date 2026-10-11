import {PrismaClient, WebsocketMessageDirection} from "@prisma/client";
import WebsocketMessageRepositoryInterface from "./interfaces/websocket-message-repository.interface";

export class PrismaWebsocketMessageRepository implements WebsocketMessageRepositoryInterface {

    constructor(
        private readonly prisma: PrismaClient,
    ) {
    }

    async save(
        direction: WebsocketMessageDirection,
        battleId: string | null,
        type: string,
        payload: string,
        inReplyToId: string | null = null,
    ): Promise<string> {
        const message = await this.prisma.websocketMessage.create({
            data: {
                direction,
                battleId,
                type,
                payload,
                inReplyToId,
            },
        });

        return message.id;
    }
}

export default PrismaWebsocketMessageRepository;
