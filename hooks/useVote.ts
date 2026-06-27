'use client';
import { BasicProposal } from '@bgd-labs/aave-governance-ui-helpers';
import { useState } from 'react';
import { Address } from 'viem';
import { useSwitchChain } from 'wagmi';

import { useRepresented } from '../context/RepresentedContext';
import { VOTING_CHAIN_ID } from '../lib/config';
import { buildVoteProofs, ensureProofsSubmitted } from '../lib/proofs';
import { useGovService } from './useGovService';

export type VoteStatus =
  | { kind: 'idle' }
  | { kind: 'preparing'; label: string }
  | { kind: 'submitting' }
  | { kind: 'success'; hash: `0x${string}` }
  | { kind: 'error'; message: string };

export function useVote() {
  const gov = useGovService();
  const { selected } = useRepresented();
  const { switchChainAsync } = useSwitchChain();
  const [status, setStatus] = useState<VoteStatus>({ kind: 'idle' });

  async function vote({
    raw,
    support,
  }: {
    raw: BasicProposal;
    support: boolean;
  }) {
    if (!selected) {
      setStatus({ kind: 'error', message: 'No represented address selected.' });
      return;
    }
    try {
      await switchChainAsync({ chainId: VOTING_CHAIN_ID });

      setStatus({ kind: 'preparing', label: 'Checking proofs…' });
      await ensureProofsSubmitted(gov, raw, selected as Address, (label) =>
        setStatus({ kind: 'preparing', label }),
      );

      setStatus({ kind: 'preparing', label: 'Building vote proofs…' });
      const { proofs, proofOfRepresentation } = await buildVoteProofs(
        raw,
        selected as Address,
      );

      setStatus({ kind: 'submitting' });
      const hash = await gov.voteAsRepresentative({
        proposalId: raw.id,
        support,
        voterAddress: selected as Address,
        proofOfRepresentation,
        proofs,
      });
      setStatus({ kind: 'success', hash: hash as `0x${string}` });
    } catch (e) {
      const err = e as { shortMessage?: string; message?: string };
      setStatus({
        kind: 'error',
        message: err?.shortMessage || err?.message || 'Vote failed',
      });
    }
  }

  return { vote, status };
}
