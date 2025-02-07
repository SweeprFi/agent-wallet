/// <reference lib="dom" />
import { VersionedTransaction } from "@solana/web3.js";

interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: string;
}

interface SwapParams {
  quoteResponse: any;
  userPublicKey: string;
}

export async function getJupiterQuote({
  inputMint,
  outputMint,
  amount,
  slippageBps
}: QuoteParams): Promise<any> {
  const response = await fetch(
    `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}\
&outputMint=${outputMint}\
&amount=${amount}\
&slippageBps=${slippageBps}`
  );
  const quoteResponse = await response.json();

  if (quoteResponse.error) {
    throw new Error(`Failed to get quote: ${quoteResponse.error}`);
  }

  return quoteResponse;
}

export async function getJupiterSwapTransaction({
  quoteResponse,
  userPublicKey
}: SwapParams): Promise<VersionedTransaction> {
  const response = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      computeUnitPriceMicroLamports: 'auto'
    })
  });

  const { swapTransaction } = await response.json();

  if (!swapTransaction) {
    throw new Error('Failed to get swap transaction');
  }

  // Deserialize the transaction
  const swapTransactionBuf = Uint8Array.from(
    atob(swapTransaction)
      .split('')
      .map(c => c.charCodeAt(0))
  );
  
  return VersionedTransaction.deserialize(swapTransactionBuf);
} 