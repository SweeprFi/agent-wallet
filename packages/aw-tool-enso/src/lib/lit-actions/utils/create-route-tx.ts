import { RouteData } from '@ensofinance/sdk';
import { BigNumber } from 'ethers';

/**
 * Generate and return ERC20 Approval tx
 * @param {RouteData} routeData - route data returned from Enso Client
 * @param {any} gasData - Gas data of chain
 * @param {string} chainId - Chain ID of blockchain network as string
 * @returns {Promise<{bestQuote: any;bestFee: number;amountOutMin: any;}>} The best quote and fee tier.
 */
export const createRouteTx = async (
  routeData: RouteData,
  gasData: any,
  chainId: string
) => {
  return {
    to: routeData.tx.to,
    data: routeData.tx.data,
    value: '0x0',
    gasLimit: BigNumber.from(routeData.gas).toHexString(),
    maxFeePerGas: gasData.maxFeePerGas,
    maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
    nonce: gasData.nonce,
    chainId: chainId,
    type: 2,
  };
};
