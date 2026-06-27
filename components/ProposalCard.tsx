import Link from 'next/link';

import type { UIProposal } from '../hooks/useOpenProposals';
import { VoteProgress } from './VoteProgress';

function timeLeft(seconds: number): string {
  if (seconds <= 0) return 'closing';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export function ProposalCard({ proposal }: { proposal: UIProposal }) {
  const urgent = proposal.secondsLeft > 0 && proposal.secondsLeft < 3600;
  return (
    <Link href={`/proposal/${proposal.id}`} className="card-link">
      <div className="card">
        <div className="card-head">
          <div>
            <span className="prop-id">PROP-{proposal.id}</span>
            <div className="card-title">{proposal.title}</div>
          </div>
          <span className={`chip${urgent ? ' urgent' : ''}`}>
            {timeLeft(proposal.secondsLeft)}
          </span>
        </div>
        <VoteProgress
          forVotes={proposal.forVotes}
          againstVotes={proposal.againstVotes}
        />
      </div>
    </Link>
  );
}
