import {
    Deposit,
    Withdraw
} from "../generated/UserStatistic/UpFarm"
import {UserHandler} from "./userhandler";
import {ethereum} from "@graphprotocol/graph-ts/index";
import {BlockHandler} from "./blockhandler";

export function handleDeposit(event: Deposit): void {
    UserHandler.handleDeposit(event);
}

export function handleWithdraw(event: Withdraw): void {
    UserHandler.handleWithdraw(event);
}

// 触发器，每次获得到一个block，更新统计元素
export function handleBlock(block: ethereum.Block): void {
    //BlockHandler.HandleBlock(block);
}
