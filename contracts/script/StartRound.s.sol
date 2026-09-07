// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RankingRound} from "../src/RankingRound.sol";

/// Finalize the current round if it has ended, then open the next one.
///
/// Required env: PRIVATE_KEY, ETHBID_RANKING
/// Optional: ETHBID_ROUND_DURATION (seconds, default 7 days)
///
/// Simulate:
///   forge script script/StartRound.s.sol --rpc-url mainnet
/// Broadcast:
///   forge script script/StartRound.s.sol --rpc-url mainnet --broadcast
contract StartRound is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address rankingAddr = vm.envAddress("ETHBID_RANKING");
        uint256 durationRaw = vm.envOr("ETHBID_ROUND_DURATION", uint256(7 days));
        if (durationRaw == 0 || durationRaw > type(uint64).max) revert("round duration out of range");
        uint64 duration = uint64(durationRaw);

        RankingRound ranking = RankingRound(rankingAddr);
        uint256 id = ranking.currentRoundId();
        if (id != 0) {
            (uint64 start, uint64 end, bool finalized) = ranking.rounds(id);
            console2.log("currentRoundId", id);
            console2.log("start", start);
            console2.log("end", end);
            console2.log("finalized", finalized);
            if (!finalized && block.timestamp < end) revert("round still live");
            vm.startBroadcast(pk);
            if (!finalized) ranking.finalize(id);
            ranking.startRound(duration);
            vm.stopBroadcast();
        } else {
            vm.startBroadcast(pk);
            ranking.startRound(duration);
            vm.stopBroadcast();
        }

        console2.log("nextRoundId", ranking.currentRoundId());
        console2.log("roundDuration", duration);
    }
}
