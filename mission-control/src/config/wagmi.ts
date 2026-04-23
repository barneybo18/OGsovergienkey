"use client";

import { http, createConfig } from "wagmi";
import { ogGalileoTestnet } from "./chain";
import { injected } from "wagmi/connectors";

/**
 * Wagmi configuration for Sovereign Agent Keys.
 * Connects to the 0G Galileo Testnet using browser-injected wallets (MetaMask, etc.)
 */
export const wagmiConfig = createConfig({
  chains: [ogGalileoTestnet],
  connectors: [
    injected(), // MetaMask, Rabby, etc.
  ],
  transports: {
    [ogGalileoTestnet.id]: http(),
  },
});
