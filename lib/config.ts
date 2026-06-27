import { GovernanceV3Ethereum } from '@aave-dao/aave-address-book';
import {
  appConfigInit,
  Asset,
  AssetsBalanceSlots,
  baseSlots,
} from '@bgd-labs/aave-governance-ui-helpers';
import { Address } from 'viem';

export const appConfig = appConfigInit('mainnet');

export const CORE_CHAIN_ID = 1;
export const VOTING_CHAIN_ID = 43114;

// New Avalanche voting machine (proposals > id 278). The lightweight app
// only targets current/active proposals, so the old machine is ignored.
export const AVALANCHE_VOTING_MACHINE =
  '0x4D1863d22D0ED8579f8999388BCC833CB057C2d6' as Address;

export const AAVE_ADDRESS = appConfig.additional.aaveAddress as Address;
export const A_AAVE_ADDRESS = appConfig.additional.aAaveAddress as Address;
export const STK_AAVE_ADDRESS = appConfig.additional.stkAAVEAddress as Address;
export const GOV_CORE_ADDRESS = appConfig.govCoreConfig.contractAddress as Address;

// GovernancePowerStrategy on mainnet. getFullVotingPower(user) returns an
// address's current aggregated voting power across AAVE/stkAAVE/aAAVE (incl.
// delegations) — the power they'd vote with, available before any vote is cast.
export const GOVERNANCE_POWER_STRATEGY =
  GovernanceV3Ethereum.GOVERNANCE_POWER_STRATEGY as Address;

export const assetsBalanceSlots: AssetsBalanceSlots = {
  [STK_AAVE_ADDRESS.toLowerCase()]: { ...baseSlots[Asset.STKAAVE] },
  [A_AAVE_ADDRESS.toLowerCase()]: { ...baseSlots[Asset.AAAVE] },
  [AAVE_ADDRESS.toLowerCase()]: { ...baseSlots[Asset.AAVE] },
  [GOV_CORE_ADDRESS.toLowerCase()]: { ...baseSlots[Asset.GOVCORE] },
};
