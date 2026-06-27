'use client';
import { useAccount } from 'wagmi';

import { useRepresented } from '../context/RepresentedContext';
import { useProposal } from '../hooks/useProposal';
import { useVote } from '../hooks/useVote';
import { TxButton } from './TxButton';
import { VoteProgress } from './VoteProgress';

export function VotePanel({ proposalId }: { proposalId: number }) {
  const { isConnected } = useAccount();
  const { selected } = useRepresented();
  const { proposal, isLoading, error } = useProposal(proposalId);
  const { vote, status } = useVote();

  if (isLoading)
    return (
      <div className="skeleton card" aria-busy="true" aria-label="Loading proposal">
        <div className="sk-line" style={{ width: '60%', height: 22, marginBottom: 20 }} />
        <div className="sk-line" style={{ width: '100%', height: 10, marginBottom: 24 }} />
        <div className="sk-line" style={{ width: '40%', height: 48 }} />
      </div>
    );
  if (error)
    return (
      <div className="state-row error" role="alert">
        Couldn’t load proposal: {error.message}
      </div>
    );
  if (!proposal)
    return <div className="state-row">Loading…</div>;

  const busy = status.kind === 'preparing' || status.kind === 'submitting';

  // "Has voted" when the represented address's recorded votingPower is non-zero.
  // VotingMachineData.votedInfo.votingPower is a string (18-decimal); '0' means
  // no vote cast yet.
  const hasVoted =
    proposal.raw.votingMachineData.votedInfo.votingPower !== '0';

  // Determine the gate reason (checked only when connected + selected).
  let gateReason: string | null = null;
  if (!proposal.isActive) {
    gateReason = 'Voting is not currently open for this proposal.';
  } else if (hasVoted) {
    gateReason = 'This address has already voted.';
  }

  return (
    <div className="card">
      <span className="prop-id">PROP-{proposalId}</span>
      <h2 className="vp-title">{proposal.title}</h2>

      <VoteProgress
        forVotes={proposal.forVotes}
        againstVotes={proposal.againstVotes}
      />

      <div className="vp-power">
        <div className="k">Your voting power as representative</div>
        <div className="v">
          {proposal.votingPower.toFixed(2)}
          <span className="unit">votes</span>
        </div>
      </div>

      {!isConnected && <p className="note">Connect a wallet to vote.</p>}
      {isConnected && !selected && (
        <p className="note">
          Select an address you represent on the home page.
        </p>
      )}

      {isConnected && selected && (
        <>
          {gateReason && <p className="note">{gateReason}</p>}
          <div className="cta-row">
            <TxButton
              tone="for"
              disabled={busy || !!gateReason}
              onClick={() => vote({ raw: proposal.raw, support: true })}>
              Vote For
            </TxButton>
            <TxButton
              tone="against"
              disabled={busy || !!gateReason}
              onClick={() => vote({ raw: proposal.raw, support: false })}>
              Vote Against
            </TxButton>
          </div>
        </>
      )}

      {status.kind === 'preparing' && (
        <div className="alert alert-info pulse">
          <div className="alert-body">{status.label}</div>
        </div>
      )}
      {status.kind === 'submitting' && (
        <div className="alert alert-info pulse">
          <div className="alert-body">Submitting vote…</div>
        </div>
      )}
      {status.kind === 'success' && (
        <div className="alert alert-success">
          <div className="alert-body">
            Vote submitted
            <div className="hash">{status.hash}</div>
          </div>
        </div>
      )}
      {status.kind === 'error' && (
        <div className="alert alert-error" role="alert">
          <div className="alert-body">{status.message}</div>
        </div>
      )}
    </div>
  );
}
