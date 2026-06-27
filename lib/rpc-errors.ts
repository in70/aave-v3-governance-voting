// RPC error classification for the vote-proof flow. Kept free of any client/
// browser imports so it stays unit-testable (see tests/proofs.test.ts), mirroring
// the pure-logic modules proposals.ts and representation.ts.

// Vote proofs are built from eth_getProof against the proposal's snapshot block,
// which requires the FULL historical state trie at that block. Pruning (non-
// archive) nodes drop old state and reject historical eth_getProof. Providers
// signal "no archive state" inconsistently, e.g.:
//   geth/publicnode -> -32602 InvalidParamsRpcError
//   bloXroute       -> -32000 InvalidInputRpcError "historical state ... is not available"
const ARCHIVE_STATE_RPC_CODES = new Set([-32602, -32000]);

// True when an eth_getProof failure at a historical block is the node telling us
// it lacks the state (i.e. it is not an archive node), rather than a transport,
// rate-limit, or other error we should surface verbatim.
export function isPrunedStateError(e: unknown): boolean {
  const err = e as { code?: number; name?: string; details?: string };
  const code = err?.code;
  return (
    (typeof code === 'number' && ARCHIVE_STATE_RPC_CODES.has(code)) ||
    err?.name === 'InvalidParamsRpcError' ||
    err?.name === 'InvalidInputRpcError' ||
    /historical state.*not available/i.test(err?.details ?? '')
  );
}
