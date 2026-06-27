'use client';
import { useEffect, useMemo } from 'react';
import { useConfig } from 'wagmi';

import { viemClients } from '../lib/chains';
import { GovService } from '../lib/gov-service';

let singleton: GovService | undefined;

export function useGovService(): GovService {
  const wagmiConfig = useConfig();
  const service = useMemo(() => {
    if (!singleton) singleton = new GovService(viemClients);
    return singleton;
  }, []);
  useEffect(() => {
    if (wagmiConfig) service.connectSigner(wagmiConfig);
  }, [wagmiConfig, service]);
  return service;
}
