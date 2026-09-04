// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ProjectRegistry} from "../src/ProjectRegistry.sol";
import {RankingRound, IERC20} from "../src/RankingRound.sol";

contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        if (balanceOf[msg.sender] < amount) return false;
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (balanceOf[from] < amount || allowance[from][msg.sender] < amount) return false;
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract RankingRoundTest is Test {
    ProjectRegistry internal registry;
    MockUSDC internal usdc;
    RankingRound internal ranking;
    address internal admin = address(0xAD);
    address internal owner = address(0xA11CE);
    address internal other = address(0xB0B);
    bytes32 internal projectId = keccak256("p1");

    function setUp() public {
        registry = new ProjectRegistry();
        usdc = new MockUSDC();
        ranking = new RankingRound(registry, IERC20(address(usdc)), admin, address(0));
        vm.prank(owner);
        registry.register(projectId, "ipfs://p");
        usdc.mint(owner, 1_000e6);
        vm.prank(owner);
        usdc.approve(address(ranking), type(uint256).max);
        vm.prank(admin);
        ranking.startRound(1 days);
    }

    function test_placeAndIncreaseBid() public {
        vm.prank(owner);
        ranking.placeBid(projectId, 100e6);
        assertEq(ranking.bidOf(1, projectId), 100e6);
        vm.prank(owner);
        ranking.placeBid(projectId, 40e6);
        assertEq(ranking.bidOf(1, projectId), 140e6);
        assertEq(usdc.balanceOf(address(ranking)), 140e6);
    }

    function test_strangerCannotBid() public {
        usdc.mint(other, 50e6);
        vm.prank(other);
        usdc.approve(address(ranking), 50e6);
        vm.prank(other);
        vm.expectRevert(RankingRound.NotProjectOwner.selector);
        ranking.placeBid(projectId, 50e6);
    }

    function test_withdrawReturnsUsdcAndClearsBid() public {
        vm.prank(owner);
        ranking.placeBid(projectId, 80e6);
        vm.prank(owner);
        ranking.withdraw(projectId);
        assertEq(ranking.bidOf(1, projectId), 0);
        assertEq(usdc.balanceOf(owner), 1_000e6);
    }

    function test_cannotBidAfterEnd() public {
        vm.warp(block.timestamp + 2 days);
        vm.prank(owner);
        vm.expectRevert(RankingRound.RoundClosed.selector);
        ranking.placeBid(projectId, 10e6);
    }

    function test_finalizeAfterEnd() public {
        vm.warp(block.timestamp + 2 days);
        ranking.finalize(1);
        (,, bool finalized) = ranking.rounds(1);
        assertTrue(finalized);
    }

    function test_cannotFinalizeEarly() public {
        vm.expectRevert(RankingRound.RoundNotEnded.selector);
        ranking.finalize(1);
    }

    function test_equalBidsEarlierTimestampWins() public {
        bytes32 second = keccak256("p2");
        vm.prank(other);
        registry.register(second, "ipfs://p2");
        usdc.mint(other, 200e6);
        vm.prank(other);
        usdc.approve(address(ranking), type(uint256).max);
        vm.prank(owner);
        ranking.placeBid(projectId, 50e6);
        uint64 first = ranking.firstBidAt(1, projectId);
        vm.warp(block.timestamp + 30);
        vm.prank(other);
        ranking.placeBid(second, 50e6);
        assertEq(ranking.bidOf(1, projectId), ranking.bidOf(1, second));
        assertLt(first, ranking.firstBidAt(1, second));
    }

    function test_placeBidEmitsBidPlaced() public {
        vm.expectEmit(true, true, true, true, address(ranking));
        emit RankingRound.BidPlaced(1, projectId, owner, 25e6, 25e6);
        vm.prank(owner);
        ranking.placeBid(projectId, 25e6);
    }

    function test_withdrawReenterDoesNotDoublePay() public {
        ReenterUSDC evil = new ReenterUSDC();
        RankingRound hooked = new RankingRound(registry, IERC20(address(evil)), admin, address(0));
        evil.setTarget(hooked, projectId);
        evil.mint(owner, 100e6);
        vm.prank(owner);
        evil.approve(address(hooked), type(uint256).max);
        vm.prank(admin);
        hooked.startRound(1 days);
        vm.prank(owner);
        hooked.placeBid(projectId, 40e6);
        vm.prank(owner);
        hooked.withdraw(projectId);
        assertEq(hooked.bidOf(1, projectId), 0);
        assertEq(evil.balanceOf(owner), 100e6);
    }
}

contract ReenterUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    RankingRound public ranking;
    bytes32 public pid;
    bool internal entered;

    function setTarget(RankingRound ranking_, bytes32 pid_) external {
        ranking = ranking_;
        pid = pid_;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        if (!entered && address(ranking) != address(0)) {
            entered = true;
            try ranking.withdraw(pid) {} catch {}
        }
        return true;
    }
}
