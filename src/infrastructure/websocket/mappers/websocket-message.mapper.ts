import * as streamingProto from "../../../contracts/proto/streaming";

export interface WebsocketMessageInfo {
    type: string;
    battleId: string | null;
}

export function battleRequestInfo(
    message: streamingProto.BattleRequest,
): WebsocketMessageInfo {
    if (message.init) {
        return {type: "init", battleId: message.init.battleId ?? null};
    }

    if (message.start) {
        return {type: "start", battleId: message.start.battleId ?? null};
    }

    if (message.move) {
        return {type: "move", battleId: message.move.battleId ?? null};
    }

    if (message.ping) {
        return {type: "ping", battleId: null};
    }

    if (message.leave) {
        return {type: "leave", battleId: message.leave.battleId ?? null};
    }

    if (message.connectBot) {
        return {type: "connect_bot", battleId: message.connectBot.battleId ?? null};
    }

    return {type: "unknown", battleId: null};
}

export function battleResponseInfo(
    message: streamingProto.BattleResponse,
): WebsocketMessageInfo {
    if (message.battle) {
        return {type: "battle", battleId: message.battle.id ?? null};
    }

    if (message.ping) {
        return {type: "ping", battleId: null};
    }

    if (message.error) {
        return {type: "error", battleId: null};
    }

    return {type: "unknown", battleId: null};
}
