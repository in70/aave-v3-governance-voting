'use client';
import { useOpenProposals } from '../hooks/useOpenProposals';
import { ProposalCard } from './ProposalCard';

function CardSkeleton() {
  return (
    <div className="skeleton card-link" style={{ padding: 18 }} aria-hidden="true">
      <div className="sk-line" style={{ width: '30%', height: 10, marginBottom: 12 }} />
      <div className="sk-line" style={{ width: '70%', marginBottom: 18 }} />
      <div className="sk-line" style={{ width: '100%', height: 10 }} />
    </div>
  );
}

export function ProposalList() {
  const { proposals, isLoading, error } = useOpenProposals();

  if (isLoading)
    return (
      <div aria-busy="true" aria-label="Loading proposals">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );

  if (error)
    return (
      <div className="state-row error" role="alert">
        Couldn’t load proposals: {error.message}
      </div>
    );

  if (!proposals.length)
    return (
      <div className="state-row">No proposals are open for voting right now.</div>
    );

  return (
    <div>
      {proposals.map((p) => (
        <ProposalCard key={p.id} proposal={p} />
      ))}
    </div>
  );
}
