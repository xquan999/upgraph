import {Address, BigInt, ethereum, log} from "@graphprotocol/graph-ts"
import {
    UpFarm,
    Deposit,
    Withdraw
} from "../generated/UserStatistic/UpFarm"
import {PoolEvent, UserPool} from "../generated/schema"
import {Common} from "./common"

export class UserHandler
{

    private static handlePoolEvent(paramUser: Address, paramPId: BigInt, paramAmount: BigInt,
                    event:ethereum.Event, type:number): void {
        log.warning('*********** handlePoolEvent',  []);
        let transaction = event.transaction;
        let block = event.block;

        log.warning('*********** Handle Pool {} {}',  [paramPId.toString(), paramUser.toHex()]);
        let upFarm = UpFarm.bind(event.address)
        let userInfo = upFarm.userInfo(paramPId, paramUser)

        // Entity UserPool
        let userPoolid = paramUser.toHex() + "_" + Common.NetworkType + "_" + paramPId.toString();
        let userPool = UserPool.load(userPoolid)
        if (userPool == null) {
            userPool = new UserPool(userPoolid)
            userPool.pid = paramPId;
            userPool.network = Common.NetworkType;
            userPool.user = paramUser;
        }
        userPool.shares = userInfo.value0;
        userPool.rewardDebt = userInfo.value0;

        // Entity PoolEvent
        let poolEvent = new PoolEvent(transaction.hash.toHex());
        poolEvent.type = 0;
        poolEvent.user = paramUser;
        poolEvent.pid = paramPId;
        poolEvent.network = Common.NetworkType;
        poolEvent.amount = paramAmount;

        poolEvent.index = transaction.index;
        poolEvent.gasPrice = transaction.gasPrice;
        poolEvent.gasUsed = transaction.gasUsed;
        poolEvent.value = transaction.value;

        poolEvent.timestamp = block.timestamp;
        poolEvent.number = block.number;

        // Entities can be written to the store with `.save()`
        userPool.save();
        poolEvent.save();
    }

    static handleDeposit(event: Deposit): void {
        let params = event.params;
        this.handlePoolEvent(params.user, params.pid, params.amount, event, 0);
    }

    static handleWithdraw(event: Withdraw): void {
        let params = event.params;
        this.handlePoolEvent(params.user, params.pid, params.amount, event, 1);
    }

}
