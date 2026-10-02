import type { Address, PublicClient, WalletClient } from "viem";
import { parseEther } from "viem";
import { quoteTokenToUsdc } from "@/lib/uniswap/quote-usdc";
import { bidRouterAbi, erc20Abi, projectRegistryAbi, rankingRoundAbi } from "./abi";
import { usesDirectStableBid } from "./chains";
import type { EthbidContracts } from "./config";
import { projectIdFromCanonical } from "./ids";

export type EthbidSubmitInput = {
  canonicalKey: string;
  url: string;
  targetUsdc: number;
};

export type EthbidStep = "register" | "approve" | "bid" | "swap" | "confirmed";

export function bidUnitsFromUsd(usd: number): bigint {
  if (!Number.isInteger(usd) || usd <= 0) {
    throw new Error("Bid must be a whole dollar amount.");
  }
  return BigInt(usd) * 1_000_000n;
}

async function ensureRegistered(
  contracts: EthbidContracts,
  wallet: Address,
  publicClient: PublicClient,
  walletClient: WalletClient,
  input: EthbidSubmitInput,
  onStep?: (step: EthbidStep) => void,
): Promise<`0x${string}`> {
  const projectId = projectIdFromCanonical(input.canonicalKey);
  const existing = await publicClient
    .readContract({
      address: contracts.registry,
      abi: projectRegistryAbi,
      functionName: "getProject",
      args: [projectId],
    })
    .catch(() => null);

  if (!existing) {
    onStep?.("register");
    const hash = await walletClient.writeContract({
      account: wallet,
      chain: publicClient.chain,
      address: contracts.registry,
      abi: projectRegistryAbi,
      functionName: "register",
      args: [projectId, input.url],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return projectId;
  }
  if (existing.owner.toLowerCase() !== wallet.toLowerCase()) {
    throw new Error("Unauthorized. Only the verified owner can bid.");
  }
  return projectId;
}

async function placeDirectStableBid(
  contracts: EthbidContracts,
  wallet: Address,
  publicClient: PublicClient,
  walletClient: WalletClient,
  projectId: `0x${string}`,
  amount: bigint,
  onStep?: (step: EthbidStep) => void,
): Promise<`0x${string}`> {
  const balance = await publicClient.readContract({
    address: contracts.usdc,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [wallet],
  });
  if (balance < amount) {
    const dollars = Number(amount) / 1_000_000;
    throw new Error(
      `Need ${dollars} ${contracts.bidAsset} in this wallet. Get testnet tokens from the faucet, then retry.`,
    );
  }

  const allowance = await publicClient.readContract({
    address: contracts.usdc,
    abi: erc20Abi,
    functionName: "allowance",
    args: [wallet, contracts.ranking],
  });
  if (allowance < amount) {
    onStep?.("approve");
    const approveHash = await walletClient.writeContract({
      account: wallet,
      chain: publicClient.chain,
      address: contracts.usdc,
      abi: erc20Abi,
      functionName: "approve",
      args: [contracts.ranking, amount],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  onStep?.("bid");
  const hash = await walletClient.writeContract({
    account: wallet,
    chain: publicClient.chain,
    address: contracts.ranking,
    abi: rankingRoundAbi,
    functionName: "placeBid",
    args: [projectId, amount],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

async function placeEthSwapBid(
  contracts: EthbidContracts,
  wallet: Address,
  publicClient: PublicClient,
  walletClient: WalletClient,
  projectId: `0x${string}`,
  usdcTarget: bigint,
  onStep?: (step: EthbidStep) => void,
): Promise<`0x${string}`> {
  let fee = 500;
  let ethIn = parseEther("0.01");
  let minOut = 0n;
  if (publicClient.chain?.id === 1) {
    const quote = await quoteTokenToUsdc(publicClient, {
      tokenIn: contracts.weth,
      amountIn: parseEther("0.01"),
      slippageBps: 100,
    });
    ethIn = (parseEther("0.01") * usdcTarget) / quote.amountOut;
    minOut = (usdcTarget * 99n) / 100n;
    fee = quote.fee;
  }
  onStep?.("swap");
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
  const hash = await walletClient.writeContract({
    account: wallet,
    chain: publicClient.chain,
    address: contracts.router,
    abi: bidRouterAbi,
    functionName: "bidWithEth",
    args: [projectId, fee, minOut, deadline],
    value: ethIn,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function submitEthbidBid(
  contracts: EthbidContracts,
  wallet: Address,
  publicClient: PublicClient,
  walletClient: WalletClient,
  input: EthbidSubmitInput,
  onStep?: (step: EthbidStep) => void,
): Promise<{ projectId: `0x${string}`; hash: `0x${string}` }> {
  const expected = contracts.chainId;
  const walletChain = publicClient.chain?.id;
  if (walletChain != null && walletChain !== expected) {
    throw new Error("Wrong network. Switch the wallet to the ETHBid chain.");
  }

  const projectId = await ensureRegistered(
    contracts,
    wallet,
    publicClient,
    walletClient,
    input,
    onStep,
  );
  const usdcTarget = bidUnitsFromUsd(input.targetUsdc);
  const hash = usesDirectStableBid(contracts.chainId)
    ? await placeDirectStableBid(contracts, wallet, publicClient, walletClient, projectId, usdcTarget, onStep)
    : await placeEthSwapBid(contracts, wallet, publicClient, walletClient, projectId, usdcTarget, onStep);
  onStep?.("confirmed");
  return { projectId, hash };
}
