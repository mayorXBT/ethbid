// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ProjectRegistry} from "../src/ProjectRegistry.sol";
import {RankingRound, IERC20} from "../src/RankingRound.sol";
import {BidRouter, ISwapRouter02, IWETH} from "../src/BidRouter.sol";

contract MockERC20 {
    string public name;
    uint8 public immutable decimals;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory name_, uint8 decimals_) {
        name = name_;
        decimals = decimals_;
    }

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

contract MockWETH is MockERC20 {
    constructor() MockERC20("WETH", 18) {}

    function deposit() external payable {
        balanceOf[msg.sender] += msg.value;
    }
}

contract MockSwapRouter {
    MockERC20 public immutable usdc;
    uint256 public leftoverBps;

    constructor(MockERC20 usdc_) {
        usdc = usdc_;
    }

    function setLeftoverBps(uint256 bps) external {
        leftoverBps = bps;
    }

    function exactInputSingle(ISwapRouter02.ExactInputSingleParams calldata params) external payable returns (uint256 amountOut) {
        uint256 pull = params.amountIn;
        if (leftoverBps > 0) {
            pull = (params.amountIn * (10_000 - leftoverBps)) / 10_000;
        }
        require(IERC20(params.tokenIn).transferFrom(msg.sender, address(this), pull), "in");
        amountOut = pull / 1e12;
        require(amountOut >= params.amountOutMinimum, "min");
        usdc.mint(params.recipient, amountOut);
    }
}

contract BidRouterTest is Test {
    ProjectRegistry internal registry;
    MockERC20 internal usdc;
    MockWETH internal weth;
    MockERC20 internal alt;
    MockSwapRouter internal swap;
    RankingRound internal ranking;
    BidRouter internal router;
    address internal admin = address(0xAD);
    address internal treasury = address(0x7ea5);
    address internal owner = address(0xA11CE);
    address internal other = address(0xB0B);
    bytes32 internal projectId = keccak256("p1");

    function setUp() public {
        registry = new ProjectRegistry();
        usdc = new MockERC20("USDC", 6);
        weth = new MockWETH();
        alt = new MockERC20("ALT", 18);
        swap = new MockSwapRouter(usdc);
        ranking = new RankingRound(registry, IERC20(address(usdc)), admin, treasury);
        router = new BidRouter(registry, ranking, ISwapRouter02(address(swap)), IERC20(address(usdc)), IWETH(address(weth)));
        vm.prank(admin);
        ranking.setRouter(address(router));
        vm.prank(owner);
        registry.register(projectId, "ipfs://p");
        vm.prank(admin);
        ranking.startRound(1 days);
        vm.deal(owner, 10 ether);
        alt.mint(owner, 2 ether);
        vm.prank(owner);
        alt.approve(address(router), type(uint256).max);
    }

    function test_bidWithEthCreditsCanonicalUsdc() public {
        vm.prank(owner);
        router.bidWithEth{value: 1 ether}(projectId, 500, 0, block.timestamp + 60);
        assertEq(ranking.bidOf(1, projectId), 1e6);
        assertEq(usdc.balanceOf(address(ranking)), 1e6);
    }

    function test_bidWithTokenAndRefundLeftover() public {
        swap.setLeftoverBps(1000);
        uint256 before = alt.balanceOf(owner);
        vm.prank(owner);
        router.bidWithToken(projectId, address(alt), 1 ether, 500, 0, block.timestamp + 60);
        assertEq(ranking.bidOf(1, projectId), 9e5);
        assertEq(alt.balanceOf(owner), before - 9e17);
    }

    function test_deadlineReverts() public {
        vm.prank(owner);
        vm.expectRevert(BidRouter.Expired.selector);
        router.bidWithEth{value: 1 ether}(projectId, 500, 0, block.timestamp - 1);
    }

    function test_minOutReverts() public {
        vm.prank(owner);
        vm.expectRevert(bytes("min"));
        router.bidWithEth{value: 1 ether}(projectId, 500, 2e6, block.timestamp + 60);
    }

    function test_strangerCannotRoute() public {
        vm.deal(other, 1 ether);
        vm.prank(other);
        vm.expectRevert(BidRouter.NotProjectOwner.selector);
        router.bidWithEth{value: 1 ether}(projectId, 500, 0, block.timestamp + 60);
    }

    function test_usdcDirectRejected() public {
        vm.prank(owner);
        vm.expectRevert(BidRouter.UnsupportedToken.selector);
        router.bidWithToken(projectId, address(usdc), 1e6, 500, 0, block.timestamp + 60);
    }

    function test_sweepToTreasuryAfterFinalize() public {
        vm.prank(owner);
        router.bidWithEth{value: 1 ether}(projectId, 500, 0, block.timestamp + 60);
        vm.warp(block.timestamp + 2 days);
        ranking.finalize(1);
        vm.prank(admin);
        ranking.sweepToTreasury();
        assertEq(usdc.balanceOf(treasury), 1e6);
        assertEq(usdc.balanceOf(address(ranking)), 0);
    }

    function test_setTreasuryLater() public {
        address next = address(0xCA01);
        vm.prank(admin);
        ranking.setTreasury(next);
        assertEq(ranking.treasury(), next);
    }
}
