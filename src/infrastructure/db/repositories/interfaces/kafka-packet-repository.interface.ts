export interface KafkaPacketRepositoryInterface {
    save(
        topic: string,
        partition: number,
        battleId: string,
        payload: string,
    ): Promise<void>;
}

export default KafkaPacketRepositoryInterface;
