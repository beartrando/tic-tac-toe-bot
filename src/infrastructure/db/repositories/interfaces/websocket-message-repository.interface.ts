import {WebsocketMessageDirection} from "@prisma/client";

export interface WebsocketMessageRepositoryInterface {
    save(
        direction: WebsocketMessageDirection,
        battleId: string | null,
        type: string,
        payload: string,
        inReplyToId?: string | null,
    ): Promise<string>;
}

export default WebsocketMessageRepositoryInterface;
