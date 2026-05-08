/**
 * AgentRegistry contract ABI and deployment address.
 * Used by Mission Control to read/write agents on-chain.
 *
 * UPDATE the address after deploying: npm run deploy:testnet (in contracts/)
 */

export const AGENT_REGISTRY_ADDRESS = "0x8359FBd8461d0cd14a39F728d7f1BbE585bF0dC9" as `0x${string}`;

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
      { name: "_pubSignals", type: "uint256[4]" },
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
