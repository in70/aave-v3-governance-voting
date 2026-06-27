'use client';
import '@rainbow-me/rainbowkit/styles.css';
import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { WagmiProvider } from 'wagmi';

import { wagmiConfig } from '../lib/chains';
import { RepresentedProvider } from '../context/RepresentedContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#34dde8',
            accentColorForeground: '#04181b',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}>
          <RepresentedProvider>{children}</RepresentedProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
