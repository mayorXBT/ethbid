# ETHBid deployments

Addresses are pinned here after a successful broadcast. Empty means not deployed.

Do not put private keys in this file.

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
