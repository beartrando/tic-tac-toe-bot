import * as streamingProto from "../../../contracts/proto/streaming";
import logger from "@shared/logger";
import JobService from "../../../infrastructure/job/service";
import ProfileService from "../../../infrastructure/profile/service";
import BattleUpdtedUseCaseInterface from "../../../infrastructure/websocket/handlers/battle-updted-use-case-interface";
import battleEntity from "../../../domain/battle/battle.entity";
import BattleDomain from "../../../domain/battle/battle.domain";
import BattleMoveProtoMapper from "../../../infrastructure/grpc/mappers/battle-move.proto.mapper";
import BattleStatusEnum from "../../../domain/battle/enums/battle-status.enum";
import BattleStatus from "../../../domain/battle/value-objects/battle-status.vo";

export class BattleUpdatedUseCase implements BattleUpdtedUseCaseInterface {
    constructor(
        private readonly profileService: ProfileService,
        private readonly jobService: JobService,
        private readonly websocketSendEventTopic: string,
    ) {
    }

    async execute(battle: battleEntity, inReplyToId: string): Promise<void> {

        const profile = await this.profileService.fetchProfile();

        if (battle.status.equals(BattleStatus.create(BattleStatusEnum.Ready))) {
            const req = streamingProto.BattleRequest.create({
                start: {battleId: battle.id.value}
            });
            // logger.log('message moved to start')

            this.jobService.enqueue(this.websocketSendEventTopic, {request: req, inReplyToId});

            return;
        }

        const battleDomain = BattleDomain.of(battle);


        if (!await battleDomain.isMyTurn(profile.id)) {
            return;
        }

        try {
            const battleMove = battleDomain.resolveMove(profile.id);
            const req = streamingProto.BattleRequest.create({
                move: BattleMoveProtoMapper.toProto(battleMove)
            });

            this.jobService.enqueue(this.websocketSendEventTopic, {request: req, inReplyToId});
            logger.log('message moved to pgBoss')

        } catch (err) {
            logger.info(err)
        }
    }

}

export default BattleUpdatedUseCase;
