'use client';

import React, { ReactNode } from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import '@rainbow-me/rainbowkit/styles.css';

// Define 0G Galileo Testnet
const zeroG = {
  id: 16602,
  name: '0G Galileo',
  nativeCurrency: { name: '0G', symbol: 'A0G', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Scan', url: 'https://scan-testnet.0g.ai' },
  },
} as const;

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'e876020573e86c9d7d4c8f533f8d7b88';

const config = getDefaultConfig({
  appName: 'Sovereign Agent Keys (SAK)',
  projectId: projectId,
  chains: [zeroG],
  ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
