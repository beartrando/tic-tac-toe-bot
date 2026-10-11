import DeviceDeviceId from "../../src/domain/device/value-objects/device-device-id.vo";
import httpClientConfig from "../../src/infrastructure/http/configs/http.client.config";
import HttpClient from "../../src/infrastructure/http/client";
import AnonymousSignInUseCase from "../../src/application/use-cases/auth/anonimous-sign-in";
import FetchProfileUseCase from "../../src/application/use-cases/profile/fetch-profile";
import WebsocketClientService from "../../src/infrastructure/websocket/client.service";
import websocketClientConfig from "../../src/infrastructure/websocket/configs/websocket-client.config";
import WebsocketClient from "../../src/infrastructure/websocket/websocket.client";
import BattleHandler from "../../src/infrastructure/websocket/handlers/battle.handler";
import AuthService from "../../src/infrastructure/auth/service";
import authConfig from "../../src/infrastructure/auth/auth.config";
import ProfileService from "../../src/infrastructure/profile/service";
import * as streamingProto from "../../src/contracts/proto/streaming";
import * as battleProto from "../../src/contracts/proto/battle";
import RefreshTokensUseCase from "../../src/application/use-cases/auth/refresh-tokens";
import BattleEntity from "../../src/domain/battle/battle.entity";
import BattleUpdtedUseCaseInterface from "../../src/infrastructure/websocket/handlers/battle-updted-use-case-interface";
import BattleStatusEnum from "../../src/domain/battle/enums/battle-status.enum";
import BattleStatus from "../../src/domain/battle/value-objects/battle-status.vo";
import WebsocketMessageRepositoryInterface from "../../src/infrastructure/db/repositories/interfaces/websocket-message-repository.interface";


const websocketMessageRepositoryStub: WebsocketMessageRepositoryInterface = {
    save: async () => "stub-websocket-message-id",
};


class BattleMoveUseCase implements BattleUpdtedUseCaseInterface {
    private counter = 0;

    private _battle: BattleEntity | null = null;

    get battle(): BattleEntity {
        if (!this._battle) {
            throw new Error(`Battle is not received`);
        }

        return this._battle;
    }

    resetCounter(): void {
        this.counter = 0;
    }

    async execute(battle: BattleEntity, inReplyToId: string): Promise<void> {
        // console.log('Message received');
        this._battle = battle;
        // console.log(message);
        this.counter++;
        console.log(battle);
        console.log(this.counter);
        // console.log(this.counter);
    }

    async waitForCounter(
        expectedCounter: number,
        timeout = 10000,
        interval = 100,
    ): Promise<void> {
        const startedAt = Date.now();

        while (this.counter < expectedCounter) {
            if (Date.now() - startedAt >= timeout) {
                throw new Error(
                    `Timeout waiting for counter ${expectedCounter}. Current counter: ${this.counter}`,
                );
            }

            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
}


describe("Gateway Service", () => {

    test("Game story functional", async () => {

        const deviceId1 = new DeviceDeviceId(`device1-${Math.random().toString(36).substring(2, 8)}`);
        const deviceId2 = new DeviceDeviceId(`device2-${Math.random().toString(36).substring(2, 8)}`);

        // console.log(deviceId1);
        // console.log(deviceId2);

        const httpService = new HttpClient(
            httpClientConfig.host,
            httpClientConfig.port,
        );

        const anonimousSignInUseCase = new AnonymousSignInUseCase(httpService);
        const refreshTokensUseCase = new RefreshTokensUseCase(httpService);
        const authService1 = new AuthService(authConfig, anonimousSignInUseCase, refreshTokensUseCase, deviceId1);
        const authService2 = new AuthService(authConfig, anonimousSignInUseCase, refreshTokensUseCase, deviceId2);

        await authService1.start();
        await authService2.start();

        const accessToken1 = authService1.accessToken;
        const accessToken2 = authService2.accessToken;

        // console.log(accessToken1);
        // console.log(accessToken2);

        if (!accessToken1 || !accessToken2) {
            throw new Error("Failed to authenticate test bots");
        }

        const fetchProfileUseCase = new FetchProfileUseCase(httpService);
        const profileService1 = new ProfileService(authService1, fetchProfileUseCase);
        const profileService2 = new ProfileService(authService2, fetchProfileUseCase);

        const battleMoveUseCase = new BattleMoveUseCase();
        const battleHandler = new BattleHandler(battleMoveUseCase, websocketMessageRepositoryStub);

        const websocketClient1 = new WebsocketClient(
            authService1,
            profileService1,
            websocketClientConfig,
            battleHandler,
            websocketMessageRepositoryStub,
        );

        const websocketClient2 = new WebsocketClient(
            authService2,
            profileService2,
            websocketClientConfig,
            battleHandler,
            websocketMessageRepositoryStub,
        );

        const websocketService1 = new WebsocketClientService(websocketClient1);
        const websocketService2 = new WebsocketClientService(websocketClient2);

        // console.log(await profileService1.fetchProfile());
        // console.log(await profileService2.fetchProfile());

        await websocketService1.start();
        await websocketService2.start();


        const initReq = streamingProto.BattleRequest.create({init: {}});

        await websocketService1.send(initReq);
        await battleMoveUseCase.waitForCounter(1);

        if (battleMoveUseCase.battle.status.equals(BattleStatus.create(BattleStatusEnum.Matched))) {
            battleMoveUseCase.resetCounter();
            await websocketService1.stop();
            await websocketService1.start();
            await websocketService1.send(initReq);
            await battleMoveUseCase.waitForCounter(1);
        }

        expect(battleMoveUseCase.battle.status.value).toBe(BattleStatusEnum.Created);

        await websocketService2.send(initReq);

        await battleMoveUseCase.waitForCounter(2);

        expect(battleMoveUseCase.battle.status.value).toBe(BattleStatusEnum.Matched);

        await battleMoveUseCase.waitForCounter(5);

        expect(battleMoveUseCase.battle.status.value).toBe(BattleStatusEnum.Ready);

        const startReq = streamingProto.BattleRequest.create({start: {battleId: battleMoveUseCase.battle.id.value}});

        await websocketService1.send(startReq);
        await websocketService2.send(startReq);

        await battleMoveUseCase.waitForCounter(7);

        expect(battleMoveUseCase.battle.status.value).toBe(BattleStatusEnum.Started);


        const req = streamingProto.BattleRequest.create({
            move: {
                battleId: battleMoveUseCase.battle.id.value,
                cellIdx: 4
            }
        });

        await websocketService1.send(req);

        await battleMoveUseCase.waitForCounter(9);

        req.move!.cellIdx = 1;

        await websocketService2.send(req);
        await battleMoveUseCase.waitForCounter(11);

        req.move!.cellIdx = 0;

        await websocketService1.send(req);
        await battleMoveUseCase.waitForCounter(13);

        req.move!.cellIdx = 2;

        await websocketService2.send(req);
        await battleMoveUseCase.waitForCounter(15);

        req.move!.cellIdx = 8;

        await websocketService1.send(req);
        await battleMoveUseCase.waitForCounter(17);

        // console.log(battleMoveUseCase.battle);

        expect(battleMoveUseCase.battle.status.value).toBe(BattleStatusEnum.Finished);

        await websocketService1.stop();
        await websocketService2.stop();

        console.log('streams are closed')


    }, 300000);

});
