import matter from 'gray-matter';

const GATEWAYS = [
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
];

export async function getProposalMetadata(
  hash: string,
): Promise<{ title?: string; description?: string }> {
  const cid = hash.replace(/^ipfs:\/\//, '');
  for (const gw of GATEWAYS) {
    try {
      const res = await fetch(gw + cid, { cache: 'force-cache' });
      if (!res.ok) continue;
      const text = await res.text();
      const parsed = matter(text);
      return {
        title: (parsed.data.title as string) || undefined,
        description: parsed.content?.slice(0, 4000),
      };
    } catch {
      // try next gateway
    }
  }
  return {};
}
