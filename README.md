# Aave Representative Voting (Lite)

Minimal interface for Aave governance **representatives** to vote on open
proposals on behalf of the addresses that appointed them, on **Avalanche C-Chain**.

## Setup

1. `cp .env.example .env.local` and set `NEXT_PUBLIC_WC_PROJECT_ID` (WalletConnect Cloud).
   Optionally set `NEXT_PUBLIC_MAINNET_RPC_URL` / `NEXT_PUBLIC_AVALANCHE_RPC_URL`.
2. `npm install`
3. `npm run dev`

## How it works

- Reads proposals from the Aave Governance core on Ethereum mainnet, filters to
  those whose voting is active on the Avalanche voting machine.
- On connect, fetches the addresses that appointed the connected wallet as a
  representative on Avalanche.
- Voting submits storage proofs (snapshot block) and then
  `submitVoteAsRepresentative` directly on Avalanche (you pay AVAX gas).

## Scope

Representatives only · direct tx only · Avalanche only. No delegation, proposal
creation, gasless voting, or self-voting.

## Test

`npm test`

---

## Live End-to-End Verification

> These steps require a **real wallet** that is an active Avalanche representative
> for at least one address that holds voting power, plus an open Aave proposal.
> They cannot be automated without a live wallet and on-chain state.

### Preconditions

- Wallet is registered as a representative on Avalanche C-Chain
  (`setRepresentative` was previously called by the represented address).
- At least one proposal is currently in the **Active** voting state on the
  Avalanche voting machine.
- The wallet has enough AVAX to pay for gas.

### Steps

1. **Connect wallet**
   Open `http://localhost:3000` (or the deployed URL), click **Connect Wallet**,
   and sign in with the representative wallet.
   _Expected:_ The represented-address selector appears and lists the address(es)
   that appointed this wallet as representative.

2. **Home page — open proposals**
   The home page shows at least one open proposal card with live For/Against/Abstain
   tallies.
   _Expected:_ Tallies are non-zero numbers; the proposal state badge reads "Active".

3. **Select a represented address and open a proposal**
   Pick a represented address from the selector, then click on a proposal card.
   _Expected:_ The Proposal Detail page loads. The `VotePanel` shows voting power
   greater than 0 for the selected represented address.

4. **Cast a vote**
   Click **Vote For** (or Against / Abstain).
   _Expected sequence:_
   a. Wallet prompts a **chain switch to Avalanche C-Chain** (chainId 43114).
   b. If storage roots for the snapshot block are not yet registered on Avalanche,
      one or more **`processStorageRoot`** transactions are submitted and confirmed.
   c. A **`submitVoteAsRepresentative`** transaction is submitted.
   d. On confirmation, the UI displays the transaction hash.

5. **Verify tally update**
   Wait approximately 30 seconds, then refresh the proposal page.
   _Expected:_ The For/Against/Abstain tallies have updated to include the new vote;
   the `VotePanel` shows the vote as already cast (vote button is disabled).

### Notes

- Steps 4b (processStorageRoot) may be skipped if the roots are already registered
  on Avalanche for this snapshot block.
- If the wallet is not a representative for any address, the selector will be empty
  and the `VotePanel` voting power will show 0.
- Any property-shape mismatches between the ABI and the on-chain contracts should
  surface during step 4; refer to the implementer notes in the task briefs for
  the exact `node -e` commands to re-inspect live ABI shapes.
