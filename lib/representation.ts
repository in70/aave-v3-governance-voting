import { Address, zeroAddress } from 'viem';

export type RepresentationData = {
  representative: { chainId: bigint; representative: Address }[];
  represented: { chainId: bigint; votersRepresented: Address[] }[];
};

export function extractRepresentedOnChain(
  data: RepresentationData,
  chainId: number,
): Address[] {
  const all = data.represented
    .filter((item) => Number(item.chainId) === chainId)
    .flatMap((item) => item.votersRepresented)
    .filter((addr) => addr.toLowerCase() !== zeroAddress.toLowerCase());
  return [...new Set(all.map((a) => a.toLowerCase()))].map(
    (lower) => all.find((a) => a.toLowerCase() === lower) as Address,
  );
}
