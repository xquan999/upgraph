import {Address, BigInt} from "@graphprotocol/graph-ts";
import {Strategy} from "../generated/UpFarm/Strategy";
import {Common} from "./common";
import {IMarsSwapPair} from "../generated/UpFarm/IMarsSwapPair";
import {IMarsSwapFactory} from "../generated/UpFarm/IMarsSwapFactory";
import {MarsSwapERC20} from "../generated/UpFarm/MarsSwapERC20";

export class Dashboard
{
    static priceOfBNB()
    {
        let factory = IMarsSwapFactory.bind(Common.PancakeFactory);
        let BNB_BUSD_POOL = factory.getPair(Common.USDT, Common.WBNB);
        let usdtERC = MarsSwapERC20.bind(Common.USDT);
        let wbnbERC = MarsSwapERC20.bind(Common.WBNB);

        return usdtERC.balanceOf(BNB_BUSD_POOL).times(Common.OneUnit).div(wbnbERC.balanceOf(BNB_BUSD_POOL));
    }

    static tokenPriceInWBNB(token:Address) : BigInt
    {
        if (token == Common.WBNB)
            return Common.OneUnit;

        let factory = IMarsSwapFactory.bind(Common.PancakeFactory);
        let pair = factory.getPair(token, Common.WBNB);
        if (pair!=Address.fromI32(0))
        {
            let swapPair = IMarsSwapPair.bind(pair);
            let res = swapPair.getReserves();
            if (swapPair.token0() == token)
                return res.value1.times(Common.OneUnit).div(res.value0);
            else
                return res.value0.times(Common.OneUnit).div(res.value1);
        }else
            return BigInt.fromI32(0);
    }

    static tokenPriceInUsd(token:Address) : BigInt
    {
        if (token == Common.USDT)
            return Common.OneUnit;

        let factory = IMarsSwapFactory.bind(Common.PancakeFactory);
        let pair = factory.getPair(token, Common.USDT)
        if (pair!=Address.fromI32(0))
        {
            let swapPair = IMarsSwapPair.bind(pair);
            let res = swapPair.getReserves();
            if (swapPair.token0() == token)
                return res.value1.times(Common.OneUnit).div(res.value0);
            else
                return res.value0.times(Common.OneUnit).div(res.value1);
        }else
            return this.tokenPriceInWBNB(token).div(this.tokenPriceInWBNB(Common.USDT));
    }

    static lpPriceInUsd(lpToken : Address) : BigInt
    {
        let pair = IMarsSwapPair.bind(lpToken);
        let token0 = pair.token0();
        let token1 = pair.token1();
        let result = pair.getReserves();
        let token0Price = this.tokenPriceInUsd(token0);
        let token1Price = this.tokenPriceInUsd(token1);
        return result.value0.times(token0Price).plus(result.value1.times(token1Price)).div(pair.totalSupply());
    }

    static basicCompound(pid : BigInt) : BigInt
    {
        let poolInfo = Common.Master.poolInfo(pid);
        let token = poolInfo.value0;
        let allocPoint = poolInfo.value1;
        let valueInBNB = this.lpPriceInUsd(token)
            .times(Common.OneUnit)
            .div(this.priceOfBNB())
            .times(MarsSwapERC20.bind(token).balanceOf(Common.PancakeMasterchef))
            .div(Common.OneUnit);
        let cakePriceInBNB = this.tokenPriceInWBNB(Common.CAKE);
        let cakePerYearOfPool = Common.Master.cakePerBlock()
            .times(Common.BLOCK_PER_YEAR)
            .times(allocPoint)
            .div(Common.Master.totalAllocPoint());
        return cakePriceInBNB.times(cakePerYearOfPool).div(valueInBNB);
    }

    static basicCompoundOfUPFarm(pid : BigInt) : BigInt
    {
        let poolInfo = Common.UPMaster.poolInfo(pid);
        let token = poolInfo.value0;
        let allocPoint = poolInfo.value1;
        let valueInBNB = this.lpPriceInUsd(token)
            .times(Common.OneUnit)
            .div(this.priceOfBNB())
            .times(MarsSwapERC20.bind(token).balanceOf(Common.PancakeMasterchef))
            .div(Common.OneUnit);
        let UPPriceInBNB = this.tokenPriceInWBNB(Common.UP);
        let UPPerYearOfPool = Common.UPMaster.upPerBlock()
            .times(Common.BLOCK_PER_YEAR)
            .times(allocPoint)
            .div(Common.UPMaster.totalAllocPoint());
        return UPPriceInBNB.times(UPPerYearOfPool).div(valueInBNB);
    }

    static apyOfPool(pid:BigInt, compound:BigInt) : BigInt
    {
        let apr = this.basicCompound(pid)
        return apr.div(compound).plus(Common.OneUnit).pow(compound).minus(Common.OneUnit);
    }

    static tvlOfPool(pool:Address): BigInt
    {
        let strategy = Strategy.bind(pool);
        return this.lpPriceInUsd(strategy.wantAddress()).times(strategy.wantLockedTotal()).div(Common.OneUnit);
    }
}
