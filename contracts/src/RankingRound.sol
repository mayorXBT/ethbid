// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ProjectRegistry} from "./ProjectRegistry.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract RankingRound {
    ProjectRegistry public immutable registry;
    IERC20 public immutable usdc;
    address public immutable admin;
    address public router;
    address public treasury;

    struct Round {
        uint64 start;
        uint64 end;
        bool finalized;
    }

    uint256 public currentRoundId;
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(bytes32 => uint256)) public bidOf;
    mapping(uint256 => mapping(bytes32 => uint64)) public firstBidAt;

    event RoundStarted(uint256 indexed roundId, uint64 start, uint64 end);
    event BidPlaced(uint256 indexed roundId, bytes32 indexed projectId, address indexed owner, uint256 amount, uint256 total);
    event BidIncreased(uint256 indexed roundId, bytes32 indexed projectId, address indexed owner, uint256 amount, uint256 total);
    event BidWithdrawn(uint256 indexed roundId, bytes32 indexed projectId, address indexed owner, uint256 amount);
    event RoundFinalized(uint256 indexed roundId);
    event TreasurySet(address indexed treasury);
    event RouterSet(address indexed router);
    event SweptToTreasury(address indexed treasury, uint256 amount);

    error NotAdmin();
    error NotRouter();
    error RouterAlreadySet();
    error ZeroTreasury();
    error LiveRound();
    error RoundActive();
    error RoundClosed();
    error RoundNotEnded();
    error AlreadyFinalized();
    error ZeroAmount();
    error NoBid();
    error TransferFailed();
    error NotProjectOwner();
    error ZeroAddress();

    constructor(ProjectRegistry registry_, IERC20 usdc_, address admin_, address treasury_) {
        if (admin_ == address(0)) revert NotAdmin();
        registry = registry_;
        usdc = usdc_;
        admin = admin_;
        treasury = treasury_;
    }

    function setTreasury(address next) external {
        if (msg.sender != admin) revert NotAdmin();
        treasury = next;
        emit TreasurySet(next);
    }

    function setRouter(address next) external {
        if (msg.sender != admin) revert NotAdmin();
        if (router != address(0)) revert RouterAlreadySet();
        if (next == address(0)) revert ZeroAddress();
        router = next;
        emit RouterSet(next);
    }

    /// Pulls USDC from BidRouter after a swap. `bidder` must own the project.
    function creditBid(bytes32 projectId, address bidder, uint256 amount) external {
        if (msg.sender != router) revert NotRouter();
        _credit(projectId, bidder, amount, true);
    }

    function startRound(uint64 duration) external {
        if (msg.sender != admin) revert NotAdmin();
        if (duration == 0) revert RoundClosed();
        if (currentRoundId != 0 && !rounds[currentRoundId].finalized) revert RoundActive();
        uint256 roundId = ++currentRoundId;
        uint64 start = uint64(block.timestamp);
        uint64 end = start + duration;
        rounds[roundId] = Round({start: start, end: end, finalized: false});
        emit RoundStarted(roundId, start, end);
    }

    function placeBid(bytes32 projectId, uint256 amount) external {
        _credit(projectId, msg.sender, amount, false);
    }

    function withdraw(bytes32 projectId) external {
        _liveRound();
        if (registry.getProject(projectId).owner != msg.sender) revert NotProjectOwner();
        uint256 amount = bidOf[currentRoundId][projectId];
        if (amount == 0) revert NoBid();
        bidOf[currentRoundId][projectId] = 0;
        firstBidAt[currentRoundId][projectId] = 0;
        if (!usdc.transfer(msg.sender, amount)) revert TransferFailed();
        emit BidWithdrawn(currentRoundId, projectId, msg.sender, amount);
    }

    function finalize(uint256 roundId) external {
        Round storage round = rounds[roundId];
        if (round.end == 0) revert RoundClosed();
        if (round.finalized) revert AlreadyFinalized();
        if (block.timestamp < round.end) revert RoundNotEnded();
        round.finalized = true;
        emit RoundFinalized(roundId);
    }

    function sweepToTreasury() external {
        if (msg.sender != admin) revert NotAdmin();
        if (treasury == address(0)) revert ZeroTreasury();
        if (currentRoundId != 0 && !rounds[currentRoundId].finalized) revert LiveRound();
        uint256 amount = _balance();
        if (amount == 0) revert ZeroAmount();
        if (!usdc.transfer(treasury, amount)) revert TransferFailed();
        emit SweptToTreasury(treasury, amount);
    }

    function _liveRound() internal view returns (Round memory round) {
        round = rounds[currentRoundId];
        if (currentRoundId == 0 || round.finalized || block.timestamp >= round.end) revert RoundClosed();
    }

    function _credit(bytes32 projectId, address bidder, uint256 amount, bool fromRouter) internal {
        _liveRound();
        if (amount == 0) revert ZeroAmount();
        if (registry.getProject(projectId).owner != bidder) revert NotProjectOwner();
        address payer = fromRouter ? msg.sender : bidder;
        if (!usdc.transferFrom(payer, address(this), amount)) revert TransferFailed();

        uint256 previous = bidOf[currentRoundId][projectId];
        uint256 total = previous + amount;
        bidOf[currentRoundId][projectId] = total;
        if (previous == 0) {
            firstBidAt[currentRoundId][projectId] = uint64(block.timestamp);
            emit BidPlaced(currentRoundId, projectId, bidder, amount, total);
        } else {
            emit BidIncreased(currentRoundId, projectId, bidder, amount, total);
        }
    }

    function _balance() internal view returns (uint256) {
        (bool ok, bytes memory data) = address(usdc).staticcall(abi.encodeWithSignature("balanceOf(address)", address(this)));
        if (!ok || data.length < 32) return 0;
        return abi.decode(data, (uint256));
    }
}
