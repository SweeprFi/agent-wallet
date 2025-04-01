/**
 * Retrieves gas data (maxFeePerGas, maxPriorityFeePerGas, and nonce).
 * @returns {Promise<{ maxFeePerGas: string, maxPriorityFeePerGas: string, nonce: number }>} Gas data.
 */

export const getGasData = async (provider: any, pkpEthAddress: string) => {
    console.log(`Getting gas data...`);
    
    const baseFeeHistory = await provider.send('eth_feeHistory', ['0x1', 'latest', []]);
    const baseFee = ethers.BigNumber.from(baseFeeHistory.baseFeePerGas[0]);
    const nonce = await provider.getTransactionCount(pkpEthAddress);

    const priorityFee = baseFee.div(4);
    const maxFee = baseFee.mul(2);

    const gasData = {
        maxFeePerGas: maxFee.toHexString(),
        maxPriorityFeePerGas: priorityFee.toHexString(),
        nonce,
    }

    console.log(`Gas data: ${gasData}`);

    return gasData;
};