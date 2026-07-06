import { ProposalList } from '../components/ProposalList';
import { RepresentedSelector } from '../components/RepresentedSelector';

export default function Home() {
  return (
    <main>
      <div className="page-header">
        <h1 className="page-title">Representative Voting</h1>
        <p className="page-sub">
          Cast votes on open Aave v3 governance proposals on Avalanche
        </p>
      </div>

      <RepresentedSelector />

      <div className="section-label">Open proposals</div>
      <ProposalList />
    </main>
  );
}
