import { Connection, PublicKey } from "@solana/web3.js";

export async function getTokenDecimals(connection: Connection, mintAddress: string): Promise<number> {
  try {
    const info = await connection.getParsedAccountInfo(new PublicKey(mintAddress));
    if (!info.value) throw new Error('Token mint not found');

    const data = info.value.data;
    if (!('parsed' in data)) throw new Error('Failed to parse mint account data');

    const { decimals } = data.parsed.info;
    return decimals;
  } catch (error) {
    console.error('Error fetching token decimals:', error);
    throw new Error(`Failed to get decimals for token ${mintAddress}`);
  }
}