'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { VotePanel } from '../../components/VotePanel';

function ProposalContent() {
  const searchParams = useSearchParams();
  const id = Number(searchParams.get('id'));
  return <VotePanel proposalId={id} />;
}

export default function ProposalPage() {
  return (
    <main>
      <nav style={{ padding: '20px 0 8px' }}>
        <Link href="/" className="back-link">← All proposals</Link>
      </nav>
      <Suspense>
        <ProposalContent />
      </Suspense>
    </main>
  );
}
