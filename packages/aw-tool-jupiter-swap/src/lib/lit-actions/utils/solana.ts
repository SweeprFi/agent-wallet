import { Connection, Keypair, PublicKey } from "@solana/web3.js";

/**
 * Converts a Base64-encoded string into a Uint8Array.
 * @param base64 - The Base64 encoded string.
 * @returns The Uint8Array representation.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function createSolanaKeypair(decryptedPrivateKey: string): Keypair {
  const secretKeyUint8Array = base64ToUint8Array(decryptedPrivateKey);
  return Keypair.fromSecretKey(secretKeyUint8Array);
}

export function createSolanaConnection(endpoint = 'https://api.mainnet-beta.solana.com'): Connection {
  return new Connection(endpoint, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 10000
  });
}

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

/**
 * Converts a decimal amount to atomic units based on decimals
 * @param amount - The amount in decimal format (e.g. "1.5")
 * @param decimals - The number of decimal places
 * @returns The amount in atomic units as a string
 */
export function toAtomicAmount(amount: string, decimals: number): string {
  try {
    // Remove any commas from the input
    amount = amount.replace(/,/g, '');
    
    // Split into whole and decimal parts
    const [whole = '0', fraction = ''] = amount.split('.');
    
    // Remove any trailing zeros from fraction and pad if needed
    const cleanFraction = fraction.replace(/0+$/, '');
    const paddedFraction = cleanFraction.padEnd(decimals, '0');
    
    // Combine whole and fraction
    const atomicAmount = `${whole}${paddedFraction}`;
    
    // Remove leading zeros
    return atomicAmount.replace(/^0+/, '') || '0';
  } catch (error) {
    throw new Error(`Failed to convert amount ${amount} to atomic units: ${error}`);
  }
}