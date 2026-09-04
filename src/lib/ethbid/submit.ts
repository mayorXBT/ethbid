import type { Address, PublicClient, WalletClient } from "viem";
import { keccak256, parseEther, toBytes } from "viem";
import { lookupEns, parseEnsName, walletControlsEns } from "@/lib/ens/verify-ens";
import { quoteTokenToUsdc } from "@/lib/uniswap/quote-usdc";
import { bidRouterAbi, projectRegistryAbi, VerificationDomain, VerificationEns } from "./abi";
import type { EthbidContracts } from "./config";
import { ensIdentityRef, projectIdFromCanonical } from "./ids";

export type EthbidSubmitInput = {
  canonicalKey: string;
  url: string;
  ensName: string;
  domain?: string;
  domainVerified?: boolean;
  targetUsdc: number;
};

export type EthbidStep = "ens" | "register" | "verify" | "swap" | "confirmed";

export async function submitEthbidBid(
  contracts: EthbidContracts,
  wallet: Address,
  publicClient: PublicClient,
  walletClient: WalletClient,
  input: EthbidSubmitInput,
  onStep?: (step: EthbidStep) => void,
): Promise<{ projectId: `0x${string}`; hash: `0x${string}` }> {
  const projectId = projectIdFromCanonical(input.canonicalKey);
  const ens = parseEnsName(input.ensName);
  if (input.ensName.trim() && !ens) {
    throw new Error("ENS name not found. Use a name like ghoste.eth.");
  }
  if (ens) {
    onStep?.("ens");
    const lookup = await lookupEns(publicClient, ens);
    if (!lookup) throw new Error("ENS name not found.");
    if (!walletControlsEns(wallet, lookup)) {
      throw new Error("Connected wallet does not control that ENS identity.");
    }
  }

  const existing = await publicClient.readContract({
    address: contracts.registry,
    abi: projectRegistryAbi,
    functionName: "getProject",
    args: [projectId],
  }).catch(() => null);

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
  } else if (existing.owner.toLowerCase() !== wallet.toLowerCase()) {
    throw new Error("Unauthorized. Only the verified owner can bid.");
  }

  if (ens) {
    onStep?.("verify");
    const hash = await walletClient.writeContract({
      account: wallet,
      chain: publicClient.chain,
      address: contracts.registry,
      abi: projectRegistryAbi,
      functionName: "verify",
      args: [projectId, VerificationEns, ensIdentityRef(ens)],
    });
    await publicClient.waitForTransactionReceipt({ hash });
  } else if (input.domainVerified && input.domain) {
    onStep?.("verify");
    const hash = await walletClient.writeContract({
      account: wallet,
      chain: publicClient.chain,
      address: contracts.registry,
      abi: projectRegistryAbi,
      functionName: "verify",
      args: [projectId, VerificationDomain, keccak256(toBytes(input.domain))],
    });
    await publicClient.waitForTransactionReceipt({ hash });
  }

  const usdcTarget = BigInt(input.targetUsdc) * 1_000_000n;
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
  onStep?.("confirmed");
  return { projectId, hash };
}
