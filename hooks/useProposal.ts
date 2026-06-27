'use client';
import {
  BasicProposal,
  getVotingMachineProposalState,
  normalizeBN,
  normalizeVotes,
  VotingMachineProposalState,
} from '@bgd-labs/aave-governance-ui-helpers';
import { useQuery } from '@tanstack/react-query';
import { Address } from 'viem';

import { useRepresented } from '../context/RepresentedContext';
import { getProposalMetadata } from '../lib/ipfs';
import { getProposalTitle } from '../lib/proposals';
import { useGovService } from './useGovService';

export type UIProposalDetail = {
  raw: BasicProposal;
  title: string;
  description: string;
  forVotes: number;
  againstVotes: number;
  votingPower: number;
  votingChainId: number;
  isActive: boolean;
};

export function useProposal(id: number): {
  proposal: UIProposalDetail | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const gov = useGovService();
  const { selected } = useRepresented();

  const query = useQuery({
    queryKey: ['proposal', id, selected],
    refetchInterval: 30_000,
    queryFn: async (): Promise<UIProposalDetail | undefined> => {
      const { configs } = await gov.getGovCoreConfigs();
      const [raw] = await gov.getDetailedProposalsData(
        configs,
        id,
        id,
        selected as Address | undefined,
      );
      if (!raw) return undefined;

      const meta = await getProposalMetadata(raw.ipfsHash);
      // forVotes/againstVotes on the flat proposal are raw 18-decimal strings;
      // normalizeVotes divides by 1e18 to produce human-readable numbers.
      const { forVotes, againstVotes } = normalizeVotes(
        raw.votingMachineData.forVotes,
        raw.votingMachineData.againstVotes,
      );

      // The represented address's available voting power. votedInfo.votingPower
      // only becomes non-zero AFTER a vote is cast, so it always reads 0 in the
      // pre-vote UI. getFullVotingPower returns the power they'd vote with now.
      const votingPower = selected
        ? normalizeBN(
            (await gov.getFullVotingPower(selected as Address)).toString(),
            18,
          ).toNumber()
        : 0;

      return {
        raw,
        title: getProposalTitle(meta.title, raw.id),
        description: meta.description ?? '',
        forVotes,
        againstVotes,
        votingPower,
        votingChainId: raw.votingChainId,
        isActive:
          getVotingMachineProposalState(raw) ===
          VotingMachineProposalState.Active,
      };
    },
  });

  return {
    proposal: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
