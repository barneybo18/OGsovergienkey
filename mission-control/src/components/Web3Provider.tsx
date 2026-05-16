'use client';

import React, { ReactNode, useState } from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, cookieStorage, createStorage, State } from 'wagmi';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import '@rainbow-me/rainbowkit/styles.css';

// ─── 0G Galileo Testnet (Chain ID 16602) ───────────────────────────────────
export const zeroGTestnet = {
  id: 16602,
  name: '0G Galileo',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Scan', url: 'https://chainscan-galileo.0g.ai' },
  },
} as const;

// ─── 0G Mainnet / Aristotle (Chain ID 16661) ───────────────────────────────
export const zeroGMainnet = {
  id: 16661,
  name: '0G Mainnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evmrpc.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Scan', url: 'https://chainscan.0g.ai' },
  },
} as const;

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'e876020573e86c9d7d4c8f533f8d7b88';

// Export config so layout.tsx can call cookieToInitialState() server-side
export const wagmiConfig = getDefaultConfig({
  appName: 'Enclave Keys',
  projectId: projectId,
  chains: [zeroGTestnet, zeroGMainnet],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

interface Web3ProviderProps {
  children: ReactNode;
  initialState?: State;
}

export function Web3Provider({ children, initialState }: Web3ProviderProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
