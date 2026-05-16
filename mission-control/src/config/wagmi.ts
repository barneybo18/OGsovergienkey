"use client";

import { http, createConfig } from "wagmi";
import { ogGalileoTestnet, ogMainnet } from "./chain";
import { injected } from "wagmi/connectors";

/**
 * Wagmi configuration for Sovereign Agent Keys.
 * Connects to 0G Mainnet and Galileo Testnet.
 */
export const wagmiConfig = createConfig({
  chains: [ogMainnet, ogGalileoTestnet],
  connectors: [
    injected(), // MetaMask, Rabby, etc.
  ],
  transports: {
    [ogMainnet.id]: http(),
    [ogGalileoTestnet.id]: http(),
  },
});
