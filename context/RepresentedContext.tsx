'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';

type Ctx = { selected: Address | undefined; setSelected: (a: Address | undefined) => void };
const RepresentedContext = createContext<Ctx | undefined>(undefined);

export function RepresentedProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Address | undefined>(undefined);
  const { address } = useAccount();
  const prevAddress = useRef(address);
  useEffect(() => {
    if (prevAddress.current !== address) {
      prevAddress.current = address;
      setSelected(undefined);
    }
  }, [address]);
  return (
    <RepresentedContext.Provider value={{ selected, setSelected }}>
      {children}
    </RepresentedContext.Provider>
  );
}

export function useRepresented(): Ctx {
  const ctx = useContext(RepresentedContext);
  if (!ctx) throw new Error('useRepresented must be used within RepresentedProvider');
  return ctx;
}
