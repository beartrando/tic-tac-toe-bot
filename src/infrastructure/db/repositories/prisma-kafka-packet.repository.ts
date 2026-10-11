import {PrismaClient} from "@prisma/client";
import KafkaPacketRepositoryInterface from "./interfaces/kafka-packet-repository.interface";

export class PrismaKafkaPacketRepository implements KafkaPacketRepositoryInterface {

    constructor(
        private readonly prisma: PrismaClient,
    ) {
    }

    async save(
        topic: string,
        partition: number,
        battleId: string,
        payload: string,
    ): Promise<void> {
        await this.prisma.kafkaPacket.create({
            data: {
                topic,
                partition,
                battleId,
                payload,
            },
        });
    }
}

export default PrismaKafkaPacketRepository;
