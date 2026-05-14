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

// Define 0G Galileo Testnet (chain ID 16602)
const zeroG = {
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

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'e876020573e86c9d7d4c8f533f8d7b88';

// Export config so layout.tsx can call cookieToInitialState() server-side
export const wagmiConfig = getDefaultConfig({
  appName: 'Sovereign Agent Keys (SAK)',
  projectId: projectId,
  chains: [zeroG],
  ssr: true,
  // Use cookieStorage so the connection persists across page refreshes / new sessions.
  // Without this, wagmi uses noopStorage during SSR and the wallet appears disconnected
  // on every reload until the client re-hydrates (which causes the flicker + "disconnected" bug).
  storage: createStorage({
    storage: cookieStorage,
  }),
});

interface Web3ProviderProps {
  children: ReactNode;
  // initialState is passed from the server layout via cookieToInitialState().
  // This lets the client hydrate with the already-connected wallet state immediately,
  // eliminating the "appears disconnected on refresh" flash.
  initialState?: State;
}

export function Web3Provider({ children, initialState }: Web3ProviderProps) {
  // Create QueryClient inside useState to avoid sharing state across SSR requests.
  // Module-level QueryClient singletons cause hydration mismatches in Next.js App Router.
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
