/**
 * Exported ABI and deployment addresses for Sovereign Agent Keys contracts.
 * Used by the AI Orchestrator and Mission Control to interact with on-chain contracts.
 *
 * After deploying, update the addresses below with your real deployed values.
 */

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

/**
 * Deployed contract addresses.
 * UPDATE these after running: npm run deploy:testnet
 */
export const DEPLOYED_ADDRESSES = {
  // 0G Galileo Testnet (chain ID 16602)
  "0g-testnet": {
    AgentRegistry: "0x_PASTE_DEPLOYED_ADDRESS_HERE",
    MockZKVerifier: "0x_PASTE_DEPLOYED_ADDRESS_HERE",
  },
} as const;

/**
 * 0G Galileo Testnet network config
 */
export const OG_NETWORK = {
  chainId: 16602,
  name: "0G-Galileo-Testnet",
  rpcUrl: "https://evmrpc-testnet.0g.ai",
  blockExplorer: "https://chainscan-galileo.0g.ai",
  storageExplorer: "https://storagescan-galileo.0g.ai",
  faucet: "https://faucet.0g.ai",
  nativeCurrency: {
    name: "0G",
    symbol: "0G",
    decimals: 18,
  },
} as const;
