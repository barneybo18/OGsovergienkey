import { defineChain } from "viem";

/**
 * 0G Galileo Testnet chain definition for wagmi/viem.
 */
export const ogGalileoTestnet = defineChain({
  id: 16602,
  name: "0G-Galileo-Testnet",
  nativeCurrency: {
    name: "0G",
    symbol: "0G",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://evmrpc-testnet.0g.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "0G ChainScan",
      url: "https://chainscan-galileo.0g.ai",
    },
  },
  testnet: true,
});

/**
 * 0G Mainnet chain definition.
 */
export const ogMainnet = defineChain({
  id: 16661,
  name: "0G-Mainnet",
  nativeCurrency: {
    name: "0G",
    symbol: "0G",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://evmrpc.0g.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "0G ChainScan",
      url: "https://chainscan.0g.ai",
    },
  },
  testnet: false,
});
