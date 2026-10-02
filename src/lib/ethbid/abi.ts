export const projectRegistryAbi = [
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "verify",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "verification", type: "uint8" },
      { name: "identityRef", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getProject",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "bytes32" },
          { name: "owner", type: "address" },
          { name: "verification", type: "uint8" },
          { name: "identityRef", type: "bytes32" },
          { name: "metadataURI", type: "string" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "ProjectRegistered",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "verification", type: "uint8", indexed: false },
      { name: "identityRef", type: "bytes32", indexed: false },
      { name: "metadataURI", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ProjectUpdated",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "metadataURI", type: "string", indexed: false },
    ],
  },
] as const;

export const bidRouterAbi = [
  {
    type: "function",
    name: "bidWithEth",
    stateMutability: "payable",
    inputs: [
      { name: "projectId", type: "bytes32" },
      { name: "fee", type: "uint24" },
      { name: "minOut", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const VerificationEns = 1;
export const VerificationDomain = 2;

export const rankingRoundAbi = [
  {
    type: "function",
    name: "currentRoundId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "rounds",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "start", type: "uint64" },
      { name: "end", type: "uint64" },
      { name: "finalized", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "treasury",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "placeBid",
    stateMutability: "nonpayable",
    inputs: [
      { name: "projectId", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "bidOf",
    stateMutability: "view",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "projectId", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "firstBidAt",
    stateMutability: "view",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "projectId", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "uint64" }],
  },
  {
    type: "event",
    name: "BidPlaced",
    inputs: [
      { name: "roundId", type: "uint256", indexed: true },
      { name: "projectId", type: "bytes32", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "total", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BidIncreased",
    inputs: [
      { name: "roundId", type: "uint256", indexed: true },
      { name: "projectId", type: "bytes32", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "total", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BidWithdrawn",
    inputs: [
      { name: "roundId", type: "uint256", indexed: true },
      { name: "projectId", type: "bytes32", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
