# ETHBid deployments

Addresses are pinned here after a successful broadcast. Empty means not deployed.

Do not put private keys in this file.

## Arbitrum Sepolia (421614)

Buildathon target. Paxos USDG `0xFFC95faa3d63Cde504a05B567C600B78C0b41892`. WETH `0x980B62Da83eFF3D4576C647993b0c1D7faf17c73`. Uniswap v3 SwapRouter02 `0x101F443B4d1b059569D643917553c771E1b9663E`.

CREATE from this deployer reused nonce 0/1/2, so the Sepolia addresses collide with the Ethereum mainnet sequence. Always pair an address with chain ID 421614.

| Contract | Address |
|---|---|
| ProjectRegistry | [`0x5b185DC5443dca8bda7C4ca7De1a6BcA8d73C2b6`](https://sepolia.arbiscan.io/address/0x5b185DC5443dca8bda7C4ca7De1a6BcA8d73C2b6) |
| RankingRound | [`0x3cC438F47c330AB747cf5404c573156221beD2fD`](https://sepolia.arbiscan.io/address/0x3cC438F47c330AB747cf5404c573156221beD2fD) |
| BidRouter | [`0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C`](https://sepolia.arbiscan.io/address/0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C) |
| admin | `0x0F7F971D864360bE5DaA0C23D16A8E25eBe23179` |
| treasury | `0x0F7F971D864360bE5DaA0C23D16A8E25eBe23179` |
| startBlock | 314937339 |
| round | 1, 30 days (`2592000`), `settled=false`. `usdc()` is Paxos USDG. |
| round window | `1790932980` → `1793524980` |

Transactions:

| Step | Tx | gas used | wei paid |
|---|---|---|---|
| ProjectRegistry | [`0x4ebb6345…`](https://sepolia.arbiscan.io/tx/0x4ebb63452bb15a6b50d3d9d3cf1f337613d43d3fbf6833460519de21d28cbc85) | 680,951 | 27359249958951 |
| RankingRound | [`0x5dd6211e…`](https://sepolia.arbiscan.io/tx/0x5dd6211e0c3b4879103bb8ab0a4bd1d934cc68998de51ca630bf7a80cb8bfbb7) | 1,185,628 | 48143611753628 |
| BidRouter | [`0xc1fa7fd0…`](https://sepolia.arbiscan.io/tx/0xc1fa7fd0e54a15a064a88a03024126cca5085d3aa832d030369530392be802d7) | 925,590 | 37266105505590 |
| setRouter | [`0xf4c0e255…`](https://sepolia.arbiscan.io/tx/0xf4c0e2558c396163bd5afbb0e3af5c65015d8b55981b7dd80b95c666db2f3d09) | 46,913 | 1883556996913 |
| startRound | [`0x24c5a2a2…`](https://sepolia.arbiscan.io/tx/0x24c5a2a25a36de88c4c8d0fbba6c072196873074a984990454899083b7620153) | 69,918 | 2816157273918 |

Broadcast used `forge create --broadcast`. `forge script` still fails constructor decode (`IERC20` vs `address`).

Sourcify `exact_match` 2026-10-02:

- [ProjectRegistry](https://repo.sourcify.dev/421614/0x5b185DC5443dca8bda7C4ca7De1a6BcA8d73C2b6/)
- [RankingRound](https://repo.sourcify.dev/421614/0x3cC438F47c330AB747cf5404c573156221beD2fD/)
- [BidRouter](https://repo.sourcify.dev/421614/0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C/)

Live USDG E2E 2026-10-02. Faucet credited 100 USDG. Two listings: 5 USDG then 10 USDG outbid. `finalize(1)` reverts `RoundNotEnded` until the 30-day window ends.

| Step | Tx | gas used | wei paid |
|---|---|---|---|
| register A | [`0x923b9e24…`](https://sepolia.arbiscan.io/tx/0x923b9e244bc1397adab90c697022ff6b34460f1069a270f10498ac72b451e95a) | 144,219 | 5844330900219 |
| register B | [`0x33ee39e1…`](https://sepolia.arbiscan.io/tx/0x33ee39e12a62b4b3e2c5d345dabd7099597c899ba784a85eed837c105f3e40d8) | 141,241 | 5819411823241 |
| approve 20 USDG | [`0x454d20d7…`](https://sepolia.arbiscan.io/tx/0x454d20d74ea4e1d90e0c1c11caaea27095a14738de45e1829b15d087d877bb29) | 58,409 | 2353999576409 |
| placeBid 5 USDG | [`0x685106c5…`](https://sepolia.arbiscan.io/tx/0x685106c5d120a81a1d109eb149883e276f0c271568f5d61e6c074e542dda6bee) | 146,296 | 5831358706296 |
| placeBid 10 USDG | [`0x0c79dd0a…`](https://sepolia.arbiscan.io/tx/0x0c79dd0a7ab471dab240cfe902c06e19a0f4cdbca2403e09e3c7129845306e34) | 129,213 | 5233643481213 |

Frontend env after deploy:

```
NEXT_PUBLIC_ETHBID_CHAIN_ID=421614
NEXT_PUBLIC_ETHBID_REGISTRY=0x5b185DC5443dca8bda7C4ca7De1a6BcA8d73C2b6
NEXT_PUBLIC_ETHBID_RANKING=0x3cC438F47c330AB747cf5404c573156221beD2fD
NEXT_PUBLIC_ETHBID_ROUTER=0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C
NEXT_PUBLIC_ETHBID_USDC=0xFFC95faa3d63Cde504a05B567C600B78C0b41892
NEXT_PUBLIC_ETHBID_WETH=0x980B62Da83eFF3D4576C647993b0c1D7faf17c73
NEXT_PUBLIC_ETHBID_START_BLOCK=314937339
```

## Robinhood Chain testnet (46630)

Optional. Paxos USDG `0x7E955252E15c84f5768B83c41a71F9eba181802F`. RPC `https://rpc.testnet.chain.robinhood.com`. Explorer `https://explorer.testnet.chain.robinhood.com`.

| Contract | Address |
|---|---|
| ProjectRegistry | |
| RankingRound | |
| BidRouter | |

## Sepolia (11155111)

Not the live target. Operator chose Ethereum mainnet for item 14.

Uniswap v3 SwapRouter02 `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`. Circle USDC `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`. WETH `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`.

| Contract | Address |
|---|---|
| ProjectRegistry | |
| RankingRound | |
| BidRouter | |
| admin | |
| treasury | |
| tx | |
| round duration | |

Frontend env after deploy:

```
NEXT_PUBLIC_ETHBID_CHAIN_ID=11155111
NEXT_PUBLIC_ETHBID_REGISTRY=
NEXT_PUBLIC_ETHBID_RANKING=
NEXT_PUBLIC_ETHBID_ROUTER=
NEXT_PUBLIC_ETHBID_USDC=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
NEXT_PUBLIC_ETHBID_WETH=0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14
```

Broadcast (from `contracts/`, after filling `contracts/.env`):

```
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast
```

Simulate without sending:

```
forge script script/Deploy.s.sol --rpc-url sepolia
```

## Ethereum mainnet (1)

Deployed 2026-08-30. Uniswap v3 SwapRouter02 `0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45`. Circle USDC `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`. WETH `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`.

| Contract | Address |
|---|---|
| ProjectRegistry | [`0x3cC438F47c330AB747cf5404c573156221beD2fD`](https://etherscan.io/address/0x3cC438F47c330AB747cf5404c573156221beD2fD) |
| RankingRound | [`0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C`](https://etherscan.io/address/0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C) |
| BidRouter | [`0xD5ed47C1b75D41DFE2de73620C1f496d89861D1D`](https://etherscan.io/address/0xD5ed47C1b75D41DFE2de73620C1f496d89861D1D) |
| admin | `0x0F7F971D864360bE5DaA0C23D16A8E25eBe23179` |
| treasury | `0x0F7F971D864360bE5DaA0C23D16A8E25eBe23179` |
| round | 1, 7 days, not finalized |

Transactions:

| Step | Tx |
|---|---|
| ProjectRegistry | [`0x17aedf63…`](https://etherscan.io/tx/0x17aedf630e3a0a92216d737af43de29d705c7aa53a3e534f62f204aebfe1b5e3) |
| RankingRound | [`0x6dc32c63…`](https://etherscan.io/tx/0x6dc32c63596452643e9ea1e5e543c82c9296e1069665c0770f3a564204c48198) |
| BidRouter | [`0x908b753f…`](https://etherscan.io/tx/0x908b753f4e7e6ef9ba6443d58f297a99d5392ee02acadfaca2138052e842dc1a) |
| setRouter | [`0x20460381…`](https://etherscan.io/tx/0x20460381e38373bb9385f5e1282df3db930c9fbabd0c4aeed7e0f15df971c9b0) |
| startRound | [`0xcad48466…`](https://etherscan.io/tx/0xcad48466a34f72ed5e57b4c4f78890d4d2076be5632fcf046725994a2f4a9db8) |

On-chain check 2026-08-30: registry code 2800 bytes, ranking 4923, router 3810. `router()` matches BidRouter. `usdc()` is canonical USDC. `currentRoundId` is 1.

Frontend env:

```
NEXT_PUBLIC_ETHBID_CHAIN_ID=1
NEXT_PUBLIC_ETHBID_REGISTRY=0x3cC438F47c330AB747cf5404c573156221beD2fD
NEXT_PUBLIC_ETHBID_RANKING=0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C
NEXT_PUBLIC_ETHBID_ROUTER=0xD5ed47C1b75D41DFE2de73620C1f496d89861D1D
NEXT_PUBLIC_ETHBID_USDC=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
NEXT_PUBLIC_ETHBID_WETH=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
```
