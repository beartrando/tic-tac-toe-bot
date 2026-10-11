import BattleId from "../../../domain/battle/value-objects/battle-id.vo";
import JobService from "../../../infrastructure/job/service";
import * as streamingProto from "../../../contracts/proto/streaming";

export class ConnectToBattleUseCase {
    constructor(
        private readonly jobService: JobService,
        private readonly websocketSendEventTopic: string,
    ) {
    }

    async execute(battleId: BattleId): Promise<void> {
        const request = streamingProto.BattleRequest.create({init: {battleId: battleId.value}});
        this.jobService.enqueue(this.websocketSendEventTopic, {request});
    }
}

export default ConnectToBattleUseCase;
