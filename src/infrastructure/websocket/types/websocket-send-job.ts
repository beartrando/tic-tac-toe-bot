import * as streamingProto from "../../../contracts/proto/streaming";

export interface WebsocketSendJob {
    request: streamingProto.BattleRequest;
    inReplyToId?: string;
}

export default WebsocketSendJob;
