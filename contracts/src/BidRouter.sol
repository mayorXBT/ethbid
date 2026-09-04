// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ProjectRegistry} from "./ProjectRegistry.sol";
import {RankingRound, IERC20} from "./RankingRound.sol";

interface IWETH is IERC20 {
    function deposit() external payable;
}

interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

contract BidRouter {
    ProjectRegistry public immutable registry;
    RankingRound public immutable ranking;
    ISwapRouter02 public immutable swapRouter;
    IERC20 public immutable usdc;
    IWETH public immutable weth;

    uint256 private _locked = 1;

    event BidRouted(
        bytes32 indexed projectId,
        address indexed bidder,
        address tokenIn,
        uint256 amountIn,
        uint256 usdcOut
    );

    error ZeroAmount();
    error Expired();
    error Reentrant();
    error TransferFailed();
    error ApproveFailed();
    error NotProjectOwner();
    error UnsupportedToken();

    modifier nonReentrant() {
        if (_locked != 1) revert Reentrant();
        _locked = 2;
        _;
        _locked = 1;
    }

    constructor(
        ProjectRegistry registry_,
        RankingRound ranking_,
        ISwapRouter02 swapRouter_,
        IERC20 usdc_,
        IWETH weth_
    ) {
        registry = registry_;
        ranking = ranking_;
        swapRouter = swapRouter_;
        usdc = usdc_;
        weth = weth_;
    }

    function bidWithEth(bytes32 projectId, uint24 fee, uint256 minOut, uint256 deadline) external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        if (block.timestamp > deadline) revert Expired();
        if (registry.getProject(projectId).owner != msg.sender) revert NotProjectOwner();

        weth.deposit{value: msg.value}();
        if (!_approve(address(weth), address(swapRouter), msg.value)) revert ApproveFailed();
        uint256 usdcOut = _swap(address(weth), msg.value, fee, minOut);
        _credit(projectId, usdcOut);
        emit BidRouted(projectId, msg.sender, address(0), msg.value, usdcOut);
    }

    function bidWithToken(
        bytes32 projectId,
        address tokenIn,
        uint256 amountIn,
        uint24 fee,
        uint256 minOut,
        uint256 deadline
    ) external nonReentrant {
        if (amountIn == 0) revert ZeroAmount();
        if (tokenIn == address(0) || tokenIn == address(usdc)) revert UnsupportedToken();
        if (block.timestamp > deadline) revert Expired();
        if (registry.getProject(projectId).owner != msg.sender) revert NotProjectOwner();
        if (!IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn)) revert TransferFailed();

        if (!_approve(tokenIn, address(swapRouter), amountIn)) revert ApproveFailed();
        uint256 usdcOut = _swap(tokenIn, amountIn, fee, minOut);
        uint256 leftover = _balance(tokenIn);
        if (leftover > 0) {
            if (!IERC20(tokenIn).transfer(msg.sender, leftover)) revert TransferFailed();
        }
        _credit(projectId, usdcOut);
        emit BidRouted(projectId, msg.sender, tokenIn, amountIn, usdcOut);
    }

    function _swap(address tokenIn, uint256 amountIn, uint24 fee, uint256 minOut) internal returns (uint256 usdcOut) {
        usdcOut = swapRouter.exactInputSingle(
            ISwapRouter02.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: address(usdc),
                fee: fee,
                recipient: address(this),
                amountIn: amountIn,
                amountOutMinimum: minOut,
                sqrtPriceLimitX96: 0
            })
        );
    }

    function _credit(bytes32 projectId, uint256 usdcOut) internal {
        if (!_approve(address(usdc), address(ranking), usdcOut)) revert ApproveFailed();
        ranking.creditBid(projectId, msg.sender, usdcOut);
    }

    function _approve(address token, address spender, uint256 amount) internal returns (bool) {
        (bool resetOk,) = token.call(abi.encodeWithSignature("approve(address,uint256)", spender, 0));
        resetOk;
        (bool ok, bytes memory ret) = token.call(abi.encodeWithSignature("approve(address,uint256)", spender, amount));
        if (!ok) return false;
        if (ret.length == 0) return true;
        return abi.decode(ret, (bool));
    }

    function _balance(address token) internal view returns (uint256) {
        (bool ok, bytes memory data) = token.staticcall(abi.encodeWithSignature("balanceOf(address)", address(this)));
        if (!ok || data.length < 32) return 0;
        return abi.decode(data, (uint256));
    }

    receive() external payable {}
}
