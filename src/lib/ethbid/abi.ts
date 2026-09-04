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
] as const;
