import {
  IDataWarehouse_ABI,
  IGovernanceDataHelper_ABI,
  IGovernancePowerStrategy_ABI,
  IVotingMachineDataHelper_ABI,
  IVotingMachineWithProofs_ABI,
} from '@aave-dao/aave-address-book/abis';
import {
  BasicProposal,
  ContractsConstants,
  formatToProofRLP,
  getDetailedProposalsData,
  getExtendedBlock,
  getGovCoreConfigs,
  getSolidityStorageSlotBytes,
  InitialProposal,
  prepareBLockRLP,
  VMProposalStructOutput,
  VotingConfig,
} from '@bgd-labs/aave-governance-ui-helpers';
import { writeContract } from '@wagmi/core';
import {
  Address,
  Block,
  getContract,
  Hex,
  pad,
  PublicClient,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem';
import { getProof } from 'viem/actions';
import { Config } from 'wagmi';

import {
  appConfig,
  AVALANCHE_VOTING_MACHINE,
  CORE_CHAIN_ID,
  GOV_CORE_ADDRESS,
  GOVERNANCE_POWER_STRATEGY,
  VOTING_CHAIN_ID,
} from './config';
import { RepresentationData } from './representation';

// IGovernanceCore_ABI is not exported from @aave-dao/aave-address-book/abis.
// We define a minimal inline ABI covering only what this service needs.
const IGovernanceCore_ABI = [
  {
    type: 'function',
    name: 'getProposalsCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export class GovService {
  private clients: Record<number, PublicClient>;
  private wagmiConfig: Config | undefined;

  constructor(clients: Record<number, PublicClient>) {
    this.clients = clients;
  }

  connectSigner(wagmiConfig: Config) {
    this.wagmiConfig = wagmiConfig;
  }

  private govCore() {
    return getContract({
      address: GOV_CORE_ADDRESS,
      abi: IGovernanceCore_ABI,
      client: this.clients[CORE_CHAIN_ID],
    });
  }

  private govCoreDataHelper() {
    return getContract({
      address: appConfig.govCoreConfig.dataHelperContractAddress as Address,
      abi: IGovernanceDataHelper_ABI,
      client: this.clients[CORE_CHAIN_ID],
    });
  }

  private votingMachineDataHelper() {
    return getContract({
      address: appConfig.votingMachineConfig[VOTING_CHAIN_ID]
        .dataHelperContractAddress as Address,
      abi: IVotingMachineDataHelper_ABI,
      client: this.clients[VOTING_CHAIN_ID],
    });
  }

  async getGovCoreConfigs(): Promise<{
    configs: VotingConfig[];
    contractsConstants: ContractsConstants;
  }> {
    return getGovCoreConfigs({
      client: this.clients[CORE_CHAIN_ID],
      govCoreContractAddress: GOV_CORE_ADDRESS,
      govCoreDataHelperContractAddress:
        appConfig.govCoreConfig.dataHelperContractAddress as Address,
    });
  }

  async getProposalsCount(): Promise<number> {
    const count = await this.govCore().read.getProposalsCount();
    return Number(count);
  }

  private async getVotingData(
    initialProposals: InitialProposal[],
    representedAddress?: Address,
  ) {
    const formatted = initialProposals
      .filter((p) => p.votingChainId === VOTING_CHAIN_ID)
      .map((p) => ({ id: p.id, snapshotBlockHash: p.snapshotBlockHash }));
    if (!formatted.length) return [];
    return (
      (await this.votingMachineDataHelper().read.getProposalsData([
        AVALANCHE_VOTING_MACHINE,
        formatted,
        representedAddress ?? zeroAddress,
      ])) || []
    );
  }

  async getDetailedProposalsData(
    configs: VotingConfig[],
    from: number,
    to: number,
    representedAddress?: Address,
  ): Promise<BasicProposal[]> {
    const govCoreDataHelperData =
      await this.govCoreDataHelper().read.getProposalsData([
        GOV_CORE_ADDRESS,
        BigInt(from),
        BigInt(to),
        BigInt(12),
      ]);

    const initialProposals: InitialProposal[] = govCoreDataHelperData.map(
      (proposal) => ({
        id: proposal.id,
        votingChainId: Number(proposal.votingChainId),
        snapshotBlockHash: proposal.proposalData.snapshotBlockHash || zeroHash,
      }),
    );

    const votingData = await this.getVotingData(
      initialProposals,
      representedAddress,
    );

    const ids = govCoreDataHelperData.map((p) => Number(p.id));

    return getDetailedProposalsData(
      configs,
      govCoreDataHelperData,
      votingData as VMProposalStructOutput[],
      ids,
    );
  }

  async getRepresentationData(address: Address): Promise<RepresentationData> {
    const data = await this.govCoreDataHelper().read.getRepresentationData([
      GOV_CORE_ADDRESS,
      address,
      [BigInt(VOTING_CHAIN_ID)],
    ]);
    return { representative: data[0], represented: data[1] } as RepresentationData;
  }

  // Current aggregated voting power (AAVE + stkAAVE + aAAVE, including received
  // delegations) for `address`, read from the GovernancePowerStrategy on
  // mainnet. This is the power the address would vote with right now — unlike
  // votedInfo.votingPower, it is populated before any vote is cast.
  async getFullVotingPower(address: Address): Promise<bigint> {
    return this.clients[CORE_CHAIN_ID].readContract({
      abi: IGovernancePowerStrategy_ABI,
      address: GOVERNANCE_POWER_STRATEGY,
      functionName: 'getFullVotingPower',
      args: [address],
    }) as Promise<bigint>;
  }

  // Read the storage root the DataWarehouse holds for `asset` at `blockHash`.
  // Zero means proofs for that asset have not been submitted yet.
  // `getStorageRoots` is the confirmed getter name in IDataWarehouse_ABI.
  async getStorageRoot(asset: Address, blockHash: Hex): Promise<Hex> {
    const warehouse =
      appConfig.votingMachineConfig[VOTING_CHAIN_ID].dataWarehouseAddress as Address;
    return (await this.clients[VOTING_CHAIN_ID].readContract({
      abi: IDataWarehouse_ABI,
      address: warehouse,
      functionName: 'getStorageRoots',
      args: [asset, blockHash],
    })) as Hex;
  }

  // Submit the account/storage root for `asset` at the snapshot block to the
  // Avalanche DataWarehouse. Ported from the original GovDataService.sendProofs.
  async sendProofs(
    user: Address,
    blockNumber: number,
    asset: Address,
    votingChainId: number,
    baseBalanceSlotRaw: number,
    withSlot?: boolean,
  ): Promise<Hex | undefined> {
    if (!this.wagmiConfig) return undefined;
    const warehouse =
      appConfig.votingMachineConfig[votingChainId].dataWarehouseAddress as Address;

    const blockData = (await getExtendedBlock(
      this.clients[CORE_CHAIN_ID],
      blockNumber,
    )) as Block & { parentBeaconBlockRoot: Hex; requestsHash: Hex };
    const blockHeaderRLP = prepareBLockRLP(blockData);

    const slot = getSolidityStorageSlotBytes(
      pad(toHex(baseBalanceSlotRaw), { size: 32 }),
      user,
    );
    const exchangeRateSlot = pad('0x51', { size: 32 });
    const delegatedStateSlot = pad('0x40', { size: 32 });

    const isStk = asset.toLowerCase() === appConfig.additional.stkAAVEAddress.toLowerCase();
    const isAAave = asset.toLowerCase() === appConfig.additional.aAaveAddress.toLowerCase();

    if (isStk && withSlot) {
      const slotProof = await getProof(this.clients[CORE_CHAIN_ID], {
        address: asset,
        storageKeys: [exchangeRateSlot],
        blockNumber: BigInt(blockNumber),
      });
      return writeContract(this.wagmiConfig, {
        abi: IDataWarehouse_ABI,
        address: warehouse,
        functionName: 'processStorageSlot',
        args: [
          asset,
          blockData.hash as Hex,
          exchangeRateSlot,
          formatToProofRLP(slotProof.storageProof[0].proof),
        ],
        chainId: votingChainId,
      });
    }

    const storageKeys = isAAave
      ? [slot, delegatedStateSlot]
      : isStk
        ? [slot, exchangeRateSlot]
        : [slot];

    const rawAccountProofData = await getProof(this.clients[CORE_CHAIN_ID], {
      address: asset,
      storageKeys,
      blockNumber: BigInt(blockNumber),
    });

    return writeContract(this.wagmiConfig, {
      abi: IDataWarehouse_ABI,
      address: warehouse,
      functionName: 'processStorageRoot',
      args: [
        asset,
        blockData.hash as Hex,
        blockHeaderRLP,
        formatToProofRLP(rawAccountProofData.accountProof),
      ],
      chainId: votingChainId,
    });
  }

  async voteAsRepresentative(args: {
    proposalId: number;
    support: boolean;
    voterAddress: Address;
    proofOfRepresentation: Hex;
    proofs: { underlyingAsset: Address; slot: bigint; proof: Hex }[];
  }): Promise<Hex | undefined> {
    if (!this.wagmiConfig) return undefined;
    return writeContract(this.wagmiConfig, {
      abi: IVotingMachineWithProofs_ABI,
      address: AVALANCHE_VOTING_MACHINE,
      functionName: 'submitVoteAsRepresentative',
      args: [
        BigInt(args.proposalId),
        args.support,
        args.voterAddress,
        args.proofOfRepresentation,
        args.proofs,
      ],
      chainId: VOTING_CHAIN_ID,
    });
  }
}
