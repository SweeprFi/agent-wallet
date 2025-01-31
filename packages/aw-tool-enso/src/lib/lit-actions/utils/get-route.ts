import { EnsoClient } from '@ensofinance/sdk';
import { ENSO_API_KEY } from '../../../constants';

/**
 * Retrieves the best quote for a Uniswap V3 swap.
 * @param {JsonRpcProvider} provider - The Ethereum provider.
 * @param {string} tokenIn - The token to route away from
 * @param {any} amount - Amount of tokenIn
 * @param {string} tokenOut - The token to route to
 * @returns {Promise<{ bestQuote: any, bestFee: number, amountOutMin: any }>} The best quote and fee tier.
 */
export const getBestQuote = async (
  provider: any,
  tokenIn: string,
  amount: string,
  tokenOut: string
) => {
  const ensoClient = new EnsoClient({ apiKey: ENSO_API_KEY });
};
