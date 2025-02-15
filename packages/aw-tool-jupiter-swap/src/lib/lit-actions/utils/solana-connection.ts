import { Connection } from "@solana/web3.js";

export function createSolanaConnection(endpoint = 'https://api.mainnet-beta.solana.com'): Connection {
    return new Connection(endpoint, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 10000
    });
  }