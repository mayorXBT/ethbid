// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ProjectRegistry} from "../src/ProjectRegistry.sol";
import {RankingRound, IERC20} from "../src/RankingRound.sol";
import {BidRouter, ISwapRouter02, IWETH} from "../src/BidRouter.sol";

/// Deploy ETHBid contracts, pin the router once, and open the first ranking round.
/// Admin is the broadcasting key (immutable). Treasury can change later via setTreasury.
///
/// Required env: PRIVATE_KEY, ETHBID_TREASURY, ETHBID_USDC, ETHBID_WETH, ETHBID_SWAP_ROUTER
/// Optional: ETHBID_ADMIN (must equal the PRIVATE_KEY address), ETHBID_ROUND_DURATION (seconds, default 7 days)
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address admin = vm.envOr("ETHBID_ADMIN", deployer);
        address treasury = vm.envAddress("ETHBID_TREASURY");
        address usdc = vm.envAddress("ETHBID_USDC");
        address weth = vm.envAddress("ETHBID_WETH");
        address swapRouter = vm.envAddress("ETHBID_SWAP_ROUTER");
        uint256 durationRaw = vm.envOr("ETHBID_ROUND_DURATION", uint256(7 days));
        if (durationRaw == 0 || durationRaw > type(uint64).max) revert("round duration out of range");
        uint64 duration = uint64(durationRaw);

        if (admin != deployer) {
            revert("ETHBID_ADMIN must match PRIVATE_KEY; admin is immutable");
        }
        if (treasury == address(0) || usdc == address(0) || weth == address(0) || swapRouter == address(0)) {
            revert("treasury/usdc/weth/swapRouter cannot be zero");
        }

        vm.startBroadcast(pk);

        ProjectRegistry registry = new ProjectRegistry();
        RankingRound ranking = new RankingRound(registry, IERC20(usdc), admin, treasury);
        BidRouter router = new BidRouter(
            registry,
            ranking,
            ISwapRouter02(swapRouter),
            IERC20(usdc),
            IWETH(weth)
        );
        ranking.setRouter(address(router));
        ranking.startRound(duration);

        vm.stopBroadcast();

        console2.log("chainId", block.chainid);
        console2.log("admin", admin);
        console2.log("treasury", treasury);
        console2.log("usdc", usdc);
        console2.log("weth", weth);
        console2.log("swapRouter", swapRouter);
        console2.log("ProjectRegistry", address(registry));
        console2.log("RankingRound", address(ranking));
        console2.log("BidRouter", address(router));
        console2.log("roundDuration", duration);
    }
}
