import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { createPublicClient, http, PublicClient } from 'viem';
import { avalanche, mainnet } from 'viem/chains';

import { CORE_CHAIN_ID, VOTING_CHAIN_ID } from './config';

const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? '';
const mainnetRpc = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || mainnet.rpcUrls.default.http[0];
const avalancheRpc = process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL || avalanche.rpcUrls.default.http[0];

export const wagmiConfig = getDefaultConfig({
  appName: 'Aave Rep Voting',
  projectId: wcProjectId,
  chains: [avalanche, mainnet],
  transports: {
    [mainnet.id]: http(mainnetRpc),
    [avalanche.id]: http(avalancheRpc),
  },
  ssr: true,
});

export const viemClients: Record<number, PublicClient> = {
  [CORE_CHAIN_ID]: createPublicClient({ chain: mainnet, transport: http(mainnetRpc) }),
  [VOTING_CHAIN_ID]: createPublicClient({ chain: avalanche, transport: http(avalancheRpc) }),
};
