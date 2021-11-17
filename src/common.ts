import {Address, BigInt} from "@graphprotocol/graph-ts"
import {ILiquidityMiningMaster} from "../generated/GlobalStatistic/ILiquidityMiningMaster";
import {MasterChef} from "../generated/GlobalStatistic/MasterChef";

export class Common {
    static NetworkType = 'bsc';
    static UpFarmAddr = Address.fromString('0x7CB56f4691f37508572B4A9058E26092bB71bf27');
    static CompoundOfYear = BigInt.fromI32(3); //365

    static USDT = Address.fromString('0xfa63D18f435a0fDb13a1a0d38608f14c38c0250E');
    static WBNB = Address.fromString('0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd');
    static CAKE = Address.fromString('0xd459A12b1cF343970703b66e62eB3B8D3f3a013E');
    static UP = Address.fromString('0x575439c835262D6c611b2Ae3aEeDc0463D9BF350');
    static XMS = Address.fromString('0x72a17e2a6dEE9d6A446176CfE3Cec8257CE13F06');
    static PancakeFactory: Address;
    static PancakeMasterchef: Address;

    static Master = MasterChef.bind(Common.PancakeMasterchef);
    static UPMaster = ILiquidityMiningMaster.bind(Common.UpFarmAddr);

    static OneUnit = BigInt.fromString('1000000000000000000');
    static BLOCK_PER_YEAR = BigInt.fromI32(1120000);

    static NameDict =
        {
            8: 'cake-wbnb',
            9: 'cake-wbnb',
        }
}
