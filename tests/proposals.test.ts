import { describe, expect, it } from 'vitest';
import {
  getProposalTitle,
  isVotingWindowOpen,
  secondsLeftInWindow,
  sortProposalsNewestFirst,
} from '../lib/proposals';

describe('isVotingWindowOpen', () => {
  const base = { votingStartTime: 1000, votingDuration: 600, votingClosedAndSentTimestamp: 0 };
  it('is false before voting starts on the machine', () => {
    expect(isVotingWindowOpen({ ...base, votingStartTime: 0, nowUnix: 1200 })).toBe(false);
  });
  it('is true within the window', () => {
    expect(isVotingWindowOpen({ ...base, nowUnix: 1200 })).toBe(true);
  });
  it('is false after the window ends', () => {
    expect(isVotingWindowOpen({ ...base, nowUnix: 1700 })).toBe(false);
  });
  it('is false once the vote has been closed and sent', () => {
    expect(isVotingWindowOpen({ ...base, votingClosedAndSentTimestamp: 1300, nowUnix: 1200 })).toBe(false);
  });
});

describe('secondsLeftInWindow', () => {
  it('returns remaining seconds', () => {
    expect(secondsLeftInWindow({ votingStartTime: 1000, votingDuration: 600, nowUnix: 1200 })).toBe(400);
  });
  it('never returns negative', () => {
    expect(secondsLeftInWindow({ votingStartTime: 1000, votingDuration: 600, nowUnix: 9000 })).toBe(0);
  });
});

describe('sortProposalsNewestFirst', () => {
  it('orders by id descending', () => {
    expect(sortProposalsNewestFirst([{ id: 1 }, { id: 3 }, { id: 2 }])).toEqual([
      { id: 3 }, { id: 2 }, { id: 1 },
    ]);
  });
  it('does not mutate the input', () => {
    const input = [{ id: 1 }, { id: 2 }];
    sortProposalsNewestFirst(input);
    expect(input).toEqual([{ id: 1 }, { id: 2 }]);
  });
});

describe('getProposalTitle', () => {
  it('uses the ipfs title when present', () => {
    expect(getProposalTitle('Onboard XYZ', 5)).toBe('Onboard XYZ');
  });
  it('falls back to the id when missing or blank', () => {
    expect(getProposalTitle(undefined, 5)).toBe('Proposal 5');
    expect(getProposalTitle('   ', 5)).toBe('Proposal 5');
  });
});
