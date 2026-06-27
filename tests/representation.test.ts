import { describe, expect, it } from 'vitest';
import { extractRepresentedOnChain } from '../lib/representation';

const ZERO = '0x0000000000000000000000000000000000000000';
const A = '0x1111111111111111111111111111111111111111';
const B = '0x2222222222222222222222222222222222222222';

describe('extractRepresentedOnChain', () => {
  const data = {
    representative: [],
    represented: [
      { chainId: 43114n, votersRepresented: [A, B, A] },
      { chainId: 137n, votersRepresented: [B] },
      { chainId: 43114n, votersRepresented: [ZERO] },
    ],
  };
  it('returns deduped represented addresses for the chain', () => {
    expect(extractRepresentedOnChain(data as any, 43114)).toEqual([A, B]);
  });
  it('excludes the zero address', () => {
    expect(extractRepresentedOnChain(data as any, 43114)).not.toContain(ZERO);
  });
  it('returns empty for a chain with no representation', () => {
    expect(extractRepresentedOnChain(data as any, 1)).toEqual([]);
  });
});
