import BattleId from "../../battle/value-objects/battle-id.vo";
import BattleMoveCellIdx from "./move/battle-move-cell-idx.vo";

export type MoveProps = {
    battleId: BattleId;
    cellIdx: BattleMoveCellIdx;
};

export class BattleMove {
    private constructor(
        public readonly battleId: BattleId,
        public readonly cellIdx: BattleMoveCellIdx,
    ) {
    }

    static create(props: MoveProps): BattleMove {
        return new BattleMove(
            props.battleId,
            props.cellIdx,
        );
    }
}

export default BattleMove;
