import {BigDecimal, BigInt, ethereum, log} from "@graphprotocol/graph-ts"

import {UpFarm, UpFarm__poolInfoResult} from "../generated/GlobalStatistic/UpFarm";
import {Pool, UpToken} from "../generated/schema"
import {Strategy} from "../generated/GlobalStatistic/Strategy";
import {IMarsSwapPair} from "../generated/GlobalStatistic/IMarsSwapPair";
import {Common} from "./common";
import {Dashboard} from "./dashboard";

export class BlockHandler
{

    static updatePool(upFarm: UpFarm, poolInfo:UpFarm__poolInfoResult, pid : BigInt) : void
    {
        let poolAddress = poolInfo.value4;
        let poolId = Common.NetworkType + "_" + poolAddress.toHex();
        let pool = Pool.load(poolId);
        if (pool==null){
            pool = new Pool(poolId);
            pool.pid = pid;
            pool.want = poolInfo.value0;
            pool.address = poolAddress;
            pool.network = Common.NetworkType;

            let st = Strategy.bind(poolAddress);
            let pancakePair = IMarsSwapPair.bind(st.wantAddress());
            pool.name = Common.NameDict[pid.toI32()];
            //pool.symbol = pancakePair.symbol();
            //pool.decimals = pancakePair.decimals();
            pool.totalSupply = pancakePair.totalSupply();

            let result = pancakePair.try_token0();
            if(!result.reverted) {
                pool.token0 = result.value;
            }

            result = pancakePair.try_token1();
            if(!result.reverted) {
                pool.token1 = result.value;
            }
        }
        pool.allocPoint = poolInfo.value1;
        pool.lastRewardBlock = poolInfo.value2;
        pool.accAUTOPerShare = poolInfo.value3;

        //log.warning('*********** Handle Pool 2',  []);
        // Strat
        let strat = Strategy.bind(poolAddress);
        pool.wantLockedTotal = strat.wantLockedTotal();
        pool.sharesTotal = strat.sharesTotal();

        //log.warning('*********** Handle Pool 3',  []);
        // if (pid.toI32() == 4)
        //     pool.poolType = 'stake';
        // else
        pool.poolType = 'normal';

        pool.apr = Dashboard.basicCompound(pid);
        pool.apy = Dashboard.apyOfPool(pid, Common.CompoundOfYear);
        pool.tvl = Dashboard.tvlOfPool(poolAddress);
        pool.upApr = Dashboard.basicCompoundOfUPFarm(pid);
        pool.lpPriceInUsd = Dashboard.lpPriceInUsd(poolInfo.value0);

        //log.warning('*********** Handle Pool 4',  []);
        // Compute Fee
        let k10 = BigDecimal.fromString("10000");
        let k1 = BigDecimal.fromString("1000");

        let entranceFeeFactor = strat.try_entranceFeeFactor();
        if (!entranceFeeFactor.reverted)
            pool.depositFee = k10.minus(BigDecimal.fromString(entranceFeeFactor.value.toString())).div(k10);
        else
            pool.depositFee = BigDecimal.fromString('0');

        // let ownerAUTOReward = BigDecimal.fromString( upFarm.ownerUPReward().toString());
        // pool.profitFee = ownerAUTOReward.div(ownerAUTOReward.plus(k1));

        let controllerFee = strat.try_controllerFee();
        if (!controllerFee.reverted) {
            let val = BigDecimal.fromString(controllerFee.value.toString());
            pool.withDrawFee = val.div(k10);
        }else
            pool.withDrawFee = BigDecimal.fromString('0');

        //save
        pool.save();
    }

    static updateUpToken(upFarm: UpFarm) : void
    {
        let upAddr = upFarm.UP();
        let tokenId = Common.NetworkType + "_" + upAddr.toHex();
        let upToken = UpToken.load(tokenId);
        if (upToken==null)
        {
            upToken = new UpToken(tokenId);
            upToken.network = Common.NetworkType;
            upToken.address = upAddr;
            upToken.farmAddress = upFarm._address;
        }
        upToken.priceInUsd = Dashboard.tokenPriceInUsd(upAddr);
        upToken.save();
    }

    static updateDashboard() : void
    {
        let upFarm = UpFarm.bind(Common.UpFarmAddr);
        for (let i = 8; i < 10; i++) {
            let pid = BigInt.fromI32(i);
            let poolInfo = upFarm.poolInfo(pid);
            BlockHandler.updatePool(upFarm, poolInfo, pid);
        }

        BlockHandler.updateUpToken(upFarm);
    }

    static HandleBlock(block: ethereum.Block): void {
        if (block.number.toI32()%10!=0)
            return;
        log.warning('*********** Handle Block Number {}',  [block.number.toString()]);
        BlockHandler.updateDashboard();
    }
}
