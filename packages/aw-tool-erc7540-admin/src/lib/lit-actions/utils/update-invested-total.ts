import { broadcastTransaction } from './broadcast-tx';
import { getTokenInfo } from './get-erc20-info';

const VAULT_INTERFACE = new ethers.utils.Interface([
    'function takeAssets(uint256 assets) external',
    'function asset() view returns (address)',
    'function updateInvestedTotal(uint256 amount) external'
]);

/**
 * Estimates the gas limit for the transaction.
 * @param {any} provider - The Ethereum provider.
 * @param {any} amount - The amount to transfer.
 * @returns {Promise<any>} Estimated gas limit.
 */
const estimateUpdateInvestedTotalGasLimit = async (
    vaultContract: any,
    pkpEthAddress: string,
    amount: string,
) => {
    console.log(`Estimating gas limit...`);

    try {
        const estimatedGas = await vaultContract.estimateGas.updateInvestedTotal(amount, { from: pkpEthAddress });
        console.log('Estimated gas limit:', estimatedGas.toString());
        return estimatedGas.mul(120).div(100);
    } catch (error) {
        console.error('Could not estimate gas. Using fallback gas limit of 100000.', error);
        return ethers.BigNumber.from('100000');
    }
};

/**
 * Creates and signs the transaction.
 * @param {any} provider - The Ethereum provider.
 * @param {string} vault - The vault address.
 * @param {any} amount - The amount to transfer.
 * @param {any} pkp - The PKP object.
 * @param {any} gasData - Gas data (maxFeePerGas, maxPriorityFeePerGas, nonce).
 */
export const updateInvestedTotal = async (
    provider: any,
    chainId: number,
    vault: string,
    amount: string,
    pkp: any,
    gasData: any
) => {
    const vaultContract = new ethers.Contract(vault, VAULT_INTERFACE, provider);
    const asset = await vaultContract.asset();
    const tokenInfo = await getTokenInfo(provider, asset, amount, pkp.ethAddress);

    console.log(`Creating and signing update transaction...`);
    const gasLimit = await estimateUpdateInvestedTotalGasLimit(vaultContract, pkp.ethAddress, tokenInfo.amount);

    const updateTx = {
        to: vault,
        data: VAULT_INTERFACE.encodeFunctionData('updateInvestedTotal', [tokenInfo.amount]),
        value: '0x0',
        gasLimit: gasLimit.toHexString(),
        maxFeePerGas: gasData.maxFeePerGas,
        maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
        nonce: gasData.nonce,
        chainId: chainId,
        type: 2,
    };
    console.log(`Signing mint with PKP public key: ${pkp.publicKey}...`);
    const updateSig = await Lit.Actions.signAndCombineEcdsa({
        toSign: ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.serializeTransaction(updateTx))),
        publicKey: pkp.publicKey.startsWith('0x') ? pkp.publicKey.slice(2) : pkp.publicKey,
        sigName: 'updateSig',
    });

    const signedTx = ethers.utils.serializeTransaction(
        updateTx,
        ethers.utils.joinSignature({
            r: '0x' + JSON.parse(updateSig).r.substring(2),
            s: '0x' + JSON.parse(updateSig).s,
            v: JSON.parse(updateSig).v,
        })
    );

    console.log("signed mint tx:", signedTx);
    const txHash = await broadcastTransaction(provider, signedTx);

    // Wait for approval confirmation
    console.log('Waiting for take confirmation...');
    const mintConfirmation = await provider.waitForTransaction(txHash, 1);

    if (mintConfirmation.status === 0) {
        throw new Error('Burn transaction failed');
    }

    return `Update invested value transaction hash: ${txHash}`;
};
