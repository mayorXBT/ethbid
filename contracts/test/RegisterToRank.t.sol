// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ProjectRegistry} from "../src/ProjectRegistry.sol";
import {RankingRound, IERC20} from "../src/RankingRound.sol";
import {BidRouter, ISwapRouter02, IWETH} from "../src/BidRouter.sol";

contract Token {
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
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function deposit() external payable {
        balanceOf[msg.sender] += msg.value;
    }
}

contract Swap {
    Token public usdc;

    constructor(Token usdc_) {
        usdc = usdc_;
    }

    function exactInputSingle(ISwapRouter02.ExactInputSingleParams calldata params) external payable returns (uint256 amountOut) {
        IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn);
        amountOut = params.amountIn / 1e12;
        require(amountOut >= params.amountOutMinimum, "min");
        usdc.mint(params.recipient, amountOut);
    }
}

/// Full to-build.md item 9: register → verify ENS identity → bid non-USDC → canonical USDC on the round.
contract RegisterToRankTest is Test {
    function test_registerVerifyBidWithEth() public {
        address founder = address(0xF0);
        address admin = address(0xAD);
        bytes32 projectId = keccak256("web:example.xyz");
        bytes32 ensNode = keccak256("ghoste.eth");

        ProjectRegistry registry = new ProjectRegistry();
        Token usdc = new Token();
        Token weth = new Token();
        Swap swap = new Swap(usdc);
        RankingRound ranking = new RankingRound(registry, IERC20(address(usdc)), admin, address(0));
        BidRouter router = new BidRouter(
            registry,
            ranking,
            ISwapRouter02(address(swap)),
            IERC20(address(usdc)),
            IWETH(address(weth))
        );
        vm.prank(admin);
        ranking.setRouter(address(router));
        vm.prank(admin);
        ranking.startRound(1 days);

        vm.deal(founder, 2 ether);
        vm.startPrank(founder);
        registry.register(projectId, "https://example.xyz");
        registry.verify(projectId, ProjectRegistry.Verification.Ens, ensNode);
        router.bidWithEth{value: 1 ether}(projectId, 500, 0, block.timestamp + 120);
        vm.stopPrank();

        ProjectRegistry.Project memory project = registry.getProject(projectId);
        assertEq(project.owner, founder);
        assertEq(uint256(project.verification), uint256(ProjectRegistry.Verification.Ens));
        assertEq(project.identityRef, ensNode);
        assertEq(ranking.bidOf(1, projectId), 1e6);
        assertEq(usdc.balanceOf(address(ranking)), 1e6);
    }
}
