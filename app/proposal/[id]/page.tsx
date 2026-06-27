import Link from 'next/link';

import { VotePanel } from '../../../components/VotePanel';

export default function ProposalPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  return (
    <main>
      <nav style={{ padding: '20px 0 8px' }}>
        <Link href="/" className="back-link">← All proposals</Link>
      </nav>
      <VotePanel proposalId={id} />
    </main>
  );
}
