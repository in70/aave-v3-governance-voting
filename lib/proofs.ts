import {
  BalanceForProof,
  BasicProposal,
  getProofOfRepresentative,
  getVotingProofs,
  normalizeBN,
} from '@bgd-labs/aave-governance-ui-helpers';
import { IAaveTokenV3_ABI } from '@bgd-labs/aave-governance-ui-helpers/dist/abis/IAaveTokenV3';
import { Address, Hex, pad, zeroHash } from 'viem';
import { getBlock, getProof, multicall } from 'viem/actions';

import { viemClients } from './chains';
import {
  A_AAVE_ADDRESS,
  assetsBalanceSlots,
  CORE_CHAIN_ID,
  GOV_CORE_ADDRESS,
  STK_AAVE_ADDRESS,
  VOTING_CHAIN_ID,
} from './config';
import { GovService } from './gov-service';
import { isPrunedStateError } from './rpc-errors';

export type VoteProof = { underlyingAsset: Address; slot: bigint; proof: Hex };

// Vote proofs are built from eth_getProof against the proposal's snapshot block,
// which requires the FULL historical state trie at that block. Pruning (non-
// archive) nodes drop old state and reject historical eth_getProof. A voting
// window is ~3 days (~21.6k blocks), so the snapshot block is always far beyond
// any node's in-memory window. Probe once up front and turn the cryptic RPC
// error into an actionable one before submitting any tx. The error-classifying
// predicate lives in ./rpc-errors so it stays unit-testable.
async function assertHistoricalStateAvailable(
  blockNumber: bigint,
  probeAsset: Address,
): Promise<void> {
  try {
    await getProof(viemClients[CORE_CHAIN_ID], {
      address: probeAsset,
      storageKeys: [pad('0x0', { size: 32 })],
      blockNumber,
    });
  } catch (e) {
    if (isPrunedStateError(e)) {
      throw new Error(
        'The configured mainnet RPC cannot serve eth_getProof at the proposal ' +
          'snapshot block — it is a pruning node, not an archive node. Vote ' +
          'proofs require historical state. Set NEXT_PUBLIC_MAINNET_RPC_URL to ' +
          'an archive endpoint (e.g. Alchemy, Infura, QuickNode, or dRPC with ' +
          'archive enabled).',
      );
    }
    throw e;
  }
}

// GovernancePowerType.VOTING === 0 (matches the original DelegationService).
const VOTING_POWER_TYPE = 0;

type ProofBalance = BalanceForProof & { underlyingAsset: Address };

// Reproduces the aAAVE delegated-power duplication from the original
// web3/utils/assetsBalanceSlots.ts formatBalances: when aAAVE carries delegated
// power AND the holder also has its own aAAVE balance, two proofs are needed —
// one for the balance slot and one for the delegation slot.
function formatBalances(balances: ProofBalance[]): ProofBalance[] {
  const aAave = balances.find(
    (b) => b.underlyingAsset.toLowerCase() === A_AAVE_ADDRESS.toLowerCase(),
  );
  if (aAave?.isWithDelegatedPower && aAave.userBalance !== '0') {
    return [...balances, { ...aAave, isWithDelegatedPower: false }];
  }
  return balances;
}

// The flat BasicProposal returned by GovService.getDetailedProposalsData does
// NOT carry per-asset voting balances (formatProposal needs the nested Proposal
// shape we don't build here). We reproduce the original
// DelegationService.getDelegatedVotingPowerByBlockHash: read balanceOf and
// getPowerCurrent(VOTING) for the represented address at the snapshot block.
async function getRepresentedBalances(
  blockHash: Hex,
  representedAddress: Address,
  votingAssets: Address[],
): Promise<ProofBalance[]> {
  const client = viemClients[CORE_CHAIN_ID];
  const block = await getBlock(client, { blockHash });

  const userBalances = await multicall(client, {
    contracts: votingAssets.map(
      (asset) =>
        ({
          address: asset,
          abi: IAaveTokenV3_ABI,
          functionName: 'balanceOf',
          args: [representedAddress],
        }) as const,
    ),
    blockNumber: block.number,
  });

  const votingPowers = await multicall(client, {
    contracts: votingAssets.map(
      (asset) =>
        ({
          address: asset,
          abi: IAaveTokenV3_ABI,
          functionName: 'getPowerCurrent',
          args: [representedAddress, VOTING_POWER_TYPE],
        }) as const,
    ),
    blockNumber: block.number,
  });

  return votingAssets.map((asset, index) => {
    const userBalance = (userBalances[index].result as bigint | undefined) ?? 0n;
    const votingPower =
      (votingPowers[index].result as bigint | undefined) ?? 0n;
    return {
      underlyingAsset: asset,
      value: normalizeBN(votingPower.toString(), 18).toString(),
      userBalance: normalizeBN(userBalance.toString(), 18).toString(),
      isWithDelegatedPower: userBalance !== votingPower,
    };
  });
}

export async function buildVoteProofs(
  proposal: BasicProposal,
  representedAddress: Address,
): Promise<{ proofs: VoteProof[]; proofOfRepresentation: Hex }> {
  const client = viemClients[CORE_CHAIN_ID];
  const snapshotBlockHash = proposal.snapshotBlockHash as Hex;
  const votingAssets = proposal.votingMachineData.votingAssets as Address[];

  const balances = formatBalances(
    await getRepresentedBalances(
      snapshotBlockHash,
      representedAddress,
      votingAssets,
    ),
  );

  const proofs = (await getVotingProofs({
    client,
    blockHash: snapshotBlockHash,
    balances,
    address: representedAddress,
    aAaveAddress: A_AAVE_ADDRESS,
    slots: assetsBalanceSlots,
  })) as VoteProof[];

  const proofOfRepresentation = (await getProofOfRepresentative({
    client,
    blockHash: proposal.votingMachineData.l1BlockHash,
    address: representedAddress,
    chainId: VOTING_CHAIN_ID,
    govCoreAddress: GOV_CORE_ADDRESS,
    aAaveAddress: A_AAVE_ADDRESS,
    slots: assetsBalanceSlots,
  })) as Hex;

  return { proofs, proofOfRepresentation };
}

// Send-proofs preflight: for each voting asset (plus the govCore representation
// root, which is NOT part of votingAssets), if the DataWarehouse has no storage
// root at the snapshot block, submit it. Each is an Avalanche tx and must be
// awaited before submitVoteAsRepresentative.
export async function ensureProofsSubmitted(
  gov: GovService,
  proposal: BasicProposal,
  representedAddress: Address,
  onTx?: (label: string) => void,
): Promise<void> {
  const core = viemClients[CORE_CHAIN_ID];
  const snapshotBlockHash = proposal.snapshotBlockHash as Hex;

  // Defense-in-depth: a zero snapshotBlockHash means the proposal was not yet
  // activated on the voting machine, so there is no block to fetch proofs from.
  if (snapshotBlockHash === zeroHash) {
    throw new Error('Proposal snapshot is not available yet');
  }

  const block = await getBlock(core, { blockHash: snapshotBlockHash });
  const blockNumber = Number(block.number);

  const votingAssets = proposal.votingMachineData.votingAssets as Address[];

  // Fail fast (before any Avalanche proof-submission tx) if the mainnet RPC
  // cannot serve historical eth_getProof at the snapshot block. Probe with the
  // first voting asset, which is guaranteed present.
  await assertHistoricalStateAvailable(block.number, votingAssets[0]);

  // submitVoteAsRepresentative verifies the govCore representation root on
  // Avalanche. votingAssets only contains the token list (AAVE/stkAAVE/aAAVE),
  // so the govCore root must be submitted separately when it is absent.
  const assetsToProve: Address[] = votingAssets.some(
    (a) => a.toLowerCase() === GOV_CORE_ADDRESS.toLowerCase(),
  )
    ? votingAssets
    : [...votingAssets, GOV_CORE_ADDRESS];

  for (const asset of assetsToProve) {
    const root = await gov.getStorageRoot(asset, snapshotBlockHash);
    if (root && root !== zeroHash) continue;

    const slotInfo = assetsBalanceSlots[asset.toLowerCase()];
    const baseSlot = slotInfo.balance;
    onTx?.(`Submitting proof for ${asset}`);
    await gov.sendProofs(
      representedAddress,
      blockNumber,
      asset,
      VOTING_CHAIN_ID,
      baseSlot,
    );

    // stkAAVE also needs its exchange-rate slot submitted once.
    if (asset.toLowerCase() === STK_AAVE_ADDRESS.toLowerCase()) {
      onTx?.(`Submitting stkAAVE exchange-rate slot`);
      await gov.sendProofs(
        representedAddress,
        blockNumber,
        asset,
        VOTING_CHAIN_ID,
        baseSlot,
        true,
      );
    }
  }
}
