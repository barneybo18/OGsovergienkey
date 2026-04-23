/**
 * AgentRegistry contract ABI and deployment address.
 * Used by Mission Control to read/write agents on-chain.
 *
 * UPDATE the address after deploying: npm run deploy:testnet (in contracts/)
 */

export const AGENT_REGISTRY_ADDRESS = "0x_PASTE_DEPLOYED_ADDRESS_HERE" as `0x${string}`;

export const AGENT_REGISTRY_ABI = [
  // ── Read Functions ────────────────────────────────────────
  {
    inputs: [{ name: "agentId", type: "uint256" }],
    name: "agents",
    outputs: [
      { name: "owner", type: "address" },
      { name: "pubKey", type: "string" },
      { name: "constitutionHash", type: "string" },
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
      { name: "pubKey", type: "string" },
      { name: "constitutionHash", type: "string" },
    ],
    name: "registerAgent",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "newConstitutionHash", type: "string" },
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
      { name: "pubInputs", type: "uint256[]" },
      { name: "zkProof", type: "bytes" },
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
      { indexed: false, name: "pubKey", type: "string" },
      { indexed: false, name: "constitutionHash", type: "string" },
    ],
    name: "AgentRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "agentId", type: "uint256" },
      { indexed: false, name: "newConstitutionHash", type: "string" },
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
