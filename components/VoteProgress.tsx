export function VoteProgress({
  forVotes,
  againstVotes,
}: {
  forVotes: number;
  againstVotes: number;
}) {
  const total = forVotes + againstVotes;
  const forPct = total > 0 ? (forVotes / total) * 100 : 0;
  const againstPct = total > 0 ? 100 - forPct : 0;

  return (
    <div className="tally">
      <div
        className="tally-bar"
        role="img"
        aria-label={`For ${forPct.toFixed(1)} percent, Against ${againstPct.toFixed(1)} percent`}>
        <span className="tally-for" style={{ width: `${forPct}%` }} />
        <span className="tally-against" style={{ width: `${againstPct}%` }} />
      </div>
      <div className="tally-legend">
        <span className="side">
          <span className="dot for" aria-hidden="true" />
          <span className="name">For</span>
          <span className="pct num">{forPct.toFixed(1)}%</span>
          <span className="val num">{forVotes.toFixed(2)}</span>
        </span>
        <span className="side against-side">
          <span className="dot against" aria-hidden="true" />
          <span className="name">Against</span>
          <span className="pct num">{againstPct.toFixed(1)}%</span>
          <span className="val num">{againstVotes.toFixed(2)}</span>
        </span>
      </div>
    </div>
  );
}
