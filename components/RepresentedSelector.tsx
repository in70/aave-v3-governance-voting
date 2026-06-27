'use client';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

import { useRepresented } from '../context/RepresentedContext';
import { useRepresentedAddresses } from '../hooks/useRepresentedAddresses';

export function RepresentedSelector() {
  const { address } = useAccount();
  const { addresses, isLoading } = useRepresentedAddresses();
  const { selected, setSelected } = useRepresented();

  useEffect(() => {
    if (!selected && addresses.length) setSelected(addresses[0]);
  }, [addresses, selected, setSelected]);

  if (!address) return null;
  if (isLoading)
    return <div className="state-row">Loading representation…</div>;
  if (!addresses.length)
    return (
      <div className="state-row">This wallet represents no one on Avalanche.</div>
    );

  return (
    <label className="rep-pill">
      <span className="label">Voting on behalf of</span>
      <select
        className="addr"
        value={selected ?? ''}
        onChange={(e) => setSelected(e.target.value as `0x${string}`)}>
        {addresses.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </label>
  );
}
