export function isVotingWindowOpen(p: {
  votingStartTime: number;
  votingDuration: number;
  votingClosedAndSentTimestamp: number;
  nowUnix: number;
}): boolean {
  if (p.votingStartTime <= 0) return false;
  if (p.votingClosedAndSentTimestamp > 0) return false;
  return p.nowUnix < p.votingStartTime + p.votingDuration;
}

export function secondsLeftInWindow(p: {
  votingStartTime: number;
  votingDuration: number;
  nowUnix: number;
}): number {
  return Math.max(0, p.votingStartTime + p.votingDuration - p.nowUnix);
}

export function sortProposalsNewestFirst<T extends { id: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.id - a.id);
}

export function getProposalTitle(ipfsTitle: string | undefined, id: number): string {
  return ipfsTitle && ipfsTitle.trim() ? ipfsTitle : `Proposal ${id}`;
}
