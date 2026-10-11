import battleEntity from "../../../domain/battle/battle.entity";

interface BattleUpdtedUseCaseInterface {
    execute(battle: battleEntity, inReplyToId: string): Promise<void>;
}

export default BattleUpdtedUseCaseInterface;
