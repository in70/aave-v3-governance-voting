'use client';
import {
  getVotingMachineProposalState,
  normalizeVotes,
  VotingMachineProposalState,
} from '@bgd-labs/aave-governance-ui-helpers';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Address } from 'viem';

import { useRepresented } from '../context/RepresentedContext';
import { getProposalMetadata } from '../lib/ipfs';
import {
  getProposalTitle,
  secondsLeftInWindow,
  sortProposalsNewestFirst,
} from '../lib/proposals';
import { useGovService } from './useGovService';

export type UIProposal = {
  id: number;
  title: string;
  forVotes: number;
  againstVotes: number;
  secondsLeft: number;
  votingChainId: number;
};

export function useOpenProposals() {
  const gov = useGovService();
  const { selected } = useRepresented();

  const query = useQuery({
    queryKey: ['open-proposals', selected],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { configs } = await gov.getGovCoreConfigs();
      const count = await gov.getProposalsCount();
      const from = Math.max(count - 1, 0);
      const proposals = await gov.getDetailedProposalsData(
        configs,
        from,
        0,
        selected as Address | undefined,
      );

      const open = proposals.filter(
        (p) =>
          getVotingMachineProposalState(p) === VotingMachineProposalState.Active,
      );

      const now = dayjs().unix();
      const ui: UIProposal[] = await Promise.all(
        sortProposalsNewestFirst(open).map(async (p) => {
          const meta = await getProposalMetadata(p.ipfsHash);
          // forVotes/againstVotes on BasicProposal are raw 18-decimal strings;
          // normalizeVotes divides by 1e18 to produce human-readable numbers.
          const { forVotes, againstVotes } = normalizeVotes(
            p.votingMachineData.forVotes,
            p.votingMachineData.againstVotes,
          );
          return {
            id: p.id,
            title: getProposalTitle(meta.title, p.id),
            forVotes,
            againstVotes,
            // p.votingDuration is the per-proposal duration already resolved by
            // getDetailedProposalsData; prefer it over configs[0].votingDuration.
            secondsLeft: secondsLeftInWindow({
              votingStartTime: p.votingMachineData.startTime,
              votingDuration: p.votingDuration,
              nowUnix: now,
            }),
            votingChainId: p.votingChainId,
          };
        }),
      );
      return ui;
    },
  });

  return {
    proposals: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
