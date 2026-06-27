import { describe, expect, it } from 'vitest';
import { isPrunedStateError } from '../lib/rpc-errors';

describe('isPrunedStateError', () => {
  it('detects geth/publicnode pruned-state rejection (-32602)', () => {
    expect(
      isPrunedStateError({ code: -32602, name: 'InvalidParamsRpcError' }),
    ).toBe(true);
  });

  it('detects bloXroute pruned-state rejection (-32000 + message)', () => {
    expect(
      isPrunedStateError({
        code: -32000,
        name: 'InvalidInputRpcError',
        details: 'historical state 40da...372d is not available',
      }),
    ).toBe(true);
  });

  it('detects by error name alone when code is absent', () => {
    expect(isPrunedStateError({ name: 'InvalidParamsRpcError' })).toBe(true);
    expect(isPrunedStateError({ name: 'InvalidInputRpcError' })).toBe(true);
  });

  it('detects by the "historical state not available" message alone', () => {
    expect(
      isPrunedStateError({ details: 'historical state is not available' }),
    ).toBe(true);
  });

  it('does NOT misclassify transport / rate-limit / unrelated errors', () => {
    expect(isPrunedStateError(new Error('fetch failed'))).toBe(false);
    expect(isPrunedStateError({ code: 429, name: 'HttpRequestError' })).toBe(
      false,
    );
    expect(isPrunedStateError({ code: -32603, name: 'InternalRpcError' })).toBe(
      false,
    );
    expect(isPrunedStateError(undefined)).toBe(false);
    expect(isPrunedStateError(null)).toBe(false);
  });
});
