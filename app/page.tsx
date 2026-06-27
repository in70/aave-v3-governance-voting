import { ProposalList } from '../components/ProposalList';
import { RepresentedSelector } from '../components/RepresentedSelector';

export default function Home() {
  return (
    <main>
      <div className="page-header">
        <h1 className="page-title">Representative Voting</h1>
        <p className="page-sub">
          Cast votes on open Aave proposals for the addresses you represent,
          validated on Avalanche by storage proofs.
        </p>
      </div>

      <RepresentedSelector />

      <div className="section-label">Open proposals</div>
      <ProposalList />
    </main>
  );
}
