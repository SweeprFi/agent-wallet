import { RouteData } from '@ensofinance/sdk';

/**
 * Generate and return ERC20 Approval tx
 * @param {RouteData} routeData - route data returned from Enso Client
 * @param {any} gasData - Gas data of chain
 * @param {number} chainId - Chain ID of blockchain network
 * @returns {Promise<{bestQuote: any;bestFee: number;amountOutMin: any;}>} The best quote and fee tier.
 */
export const createRouteTx = async (
  routeData: RouteData,
  gasData: any,
  chainId: number
) => {
  return {
    to: routeData.tx.to,
    data: routeData.tx.data,
    value: routeData.tx.value,
    gasLimit: routeData.gas,
    maxFeePerGas: gasData.maxFeePerGas,
    maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
    nonce: gasData.nonce,
    chainId: chainId.toString(),
    type: 2,
  };
};
