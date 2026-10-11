import logger from "@shared/logger";
import WebsocketClientService from "../../websocket/client.service";
import WebsocketSendJob from "../../websocket/types/websocket-send-job";


export class SendToStreamConsumer {
    constructor(
        private readonly websocketClientService: WebsocketClientService,
    ) {
    }

    async execute(job: WebsocketSendJob): Promise<void> {
        logger.log('sendToStream', job.request);

        try {
            await this.websocketClientService.send(job.request, job.inReplyToId ?? null);
        } catch (error) {
            logger.error(`[Websocket] Failed to process message`, {
                rawValue: job,
                error,
            });
            throw error;
        }

    }

}

export default SendToStreamConsumer;
