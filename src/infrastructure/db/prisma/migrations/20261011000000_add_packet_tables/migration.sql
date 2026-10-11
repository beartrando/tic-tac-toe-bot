-- CreateEnum
CREATE TYPE "WebsocketMessageDirection" AS ENUM ('received', 'sent');

-- CreateTable
CREATE TABLE "kafka_packets"
(
    "id"         TEXT          NOT NULL,
    "topic"      TEXT          NOT NULL,
    "partition"  INTEGER       NOT NULL,
    "battle_id"  TEXT          NOT NULL,
    "payload"    TEXT          NOT NULL,
    "created_at" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kafka_packets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "websocket_messages"
(
    "id"           TEXT                        NOT NULL,
    "direction"    "WebsocketMessageDirection" NOT NULL,
    "battle_id"    TEXT,
    "type"         TEXT                        NOT NULL,
    "payload"      TEXT                        NOT NULL,
    "in_reply_to_id" TEXT,
    "created_at"   TIMESTAMP(3)                NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "websocket_messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "websocket_messages"
    ADD CONSTRAINT "websocket_messages_in_reply_to_id_fkey" FOREIGN KEY ("in_reply_to_id") REFERENCES "websocket_messages" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
