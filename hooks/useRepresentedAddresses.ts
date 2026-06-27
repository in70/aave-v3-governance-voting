'use client';
import { useQuery } from '@tanstack/react-query';
import { Address } from 'viem';
import { useAccount } from 'wagmi';

import { VOTING_CHAIN_ID } from '../lib/config';
import { extractRepresentedOnChain } from '../lib/representation';
import { useGovService } from './useGovService';

const EMPTY_ADDRESSES: Address[] = [];

export function useRepresentedAddresses() {
  const { address } = useAccount();
  const gov = useGovService();
  const query = useQuery({
    queryKey: ['represented', address],
    enabled: !!address,
    queryFn: async () => {
      const data = await gov.getRepresentationData(address as Address);
      return extractRepresentedOnChain(data, VOTING_CHAIN_ID);
    },
  });
  return {
    addresses: query.data ?? EMPTY_ADDRESSES,
    isLoading: query.isLoading,
    error: query.error,
  };
}
