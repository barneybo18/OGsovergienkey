/**
 * AgentRegistry contract addresses.
 */
export const AGENT_REGISTRY_ADDRESS_TESTNET = "0x4A7DB2107b10D7694555da9C4d31FA9f7d3Feb1E" as `0x${string}`;
export const AGENT_REGISTRY_ADDRESS_MAINNET = "0x93b0650f33C86dDab1c8b6B3f0fAD768e7d3680d" as `0x${string}`;

// Default to Mainnet for production
export const AGENT_REGISTRY_ADDRESS = AGENT_REGISTRY_ADDRESS_MAINNET;

export const AGENT_REGISTRY_ABI = [
  // ── Read Functions ────────────────────────────────────────
  {
    inputs: [{ name: "agentId", type: "uint256" }],
    name: "agents",
    outputs: [
      { name: "owner", type: "address" },
      { name: "pubKeyHash", type: "bytes32" },
      { name: "constitutionHash", type: "bytes32" },
      { name: "isActive", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextAgentId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ── Write Functions ───────────────────────────────────────
  {
    inputs: [
      { name: "pubKey", type: "bytes32" },
      { name: "constitutionHash", type: "bytes32" },
    ],
    name: "registerAgent",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "newConstitutionHash", type: "bytes32" },
    ],
    name: "updateConstitution",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "intentDataId", type: "string" },
      { name: "_pA", type: "uint256[2]" },
      { name: "_pB", type: "uint256[2][2]" },
      { name: "_pC", type: "uint256[2]" },
      { name: "_pubSignals", type: "uint256[3]" },
    ],
    name: "logIntent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── Events ────────────────────────────────────────────────
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "agentId", type: "uint256" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "pubKeyHash", type: "bytes32" },
      { indexed: false, name: "constitutionHash", type: "bytes32" },
    ],
    name: "AgentRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "agentId", type: "uint256" },
      { indexed: false, name: "newConstitutionHash", type: "bytes32" },
    ],
    name: "ConstitutionUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "agentId", type: "uint256" },
      { indexed: false, name: "intentDataId", type: "string" },
    ],
    name: "IntentLogged",
    type: "event",
  },
] as const;
