import { broadcastTransaction } from './broadcast-tx';
import { approveVault } from './approve';

const VAULT_INTERFACE = new ethers.utils.Interface([
    'function fulfillDeposit(address controller, uint256 amount) returns (bool)',
    'function asset() view returns (address)',
    'function returnAssets(uint256 assets) external',
]);

/**
 * Estimates the gas limit for the transaction.
 * @param {any} vaultContract - The Ethereum provider.
 * @param {any} amount - The amount to transfer.
 * @returns {Promise<any>} Estimated gas limit.
 */
const estimateReturnAssetGasLimit = async (
    vaultContract: any,
    amount: any,
    vault: string,
    pkpEthAddress: string
) => {
    console.log(`Estimating gas limit...`);

    try {
        const estimatedGas = await vaultContract.estimateGas.transfer(vault, amount, { from: pkpEthAddress });
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
 * @param {string} controller - The controller address.
 * @param {any} amount - The amount to transfer.
 * @param {any} pkp - The PKP object.
 */
export const returnAssets = async (    
    provider: any,
    chainId: number,
    vault: string,
    amount: string,
    pkp: any,
    gasData: any
) => {
    const vaultContract = new ethers.Contract(vault, VAULT_INTERFACE, provider);
    const asset = await vaultContract.asset();
    let { parsedAmount, nonce } = await approveVault(provider, asset, vault, amount, chainId, pkp);

    console.log(`Creating and signing mint transaction...`);
    const gasLimit = await estimateReturnAssetGasLimit(vaultContract, parsedAmount, vault, pkp.ethAddress);

    const returnAssetTx = {
        to: vault,
        data: VAULT_INTERFACE.encodeFunctionData('returnAssets', [parsedAmount]),
        value: '0x0',
        gasLimit: gasLimit.toHexString(),
        maxFeePerGas: gasData.maxFeePerGas,
        maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
        nonce: nonce,
        chainId: chainId,
        type: 2,
    };

    console.log(`Signing mint with PKP public key: ${pkp.publicKey}...`);
    const returnSig = await Lit.Actions.signAndCombineEcdsa({
        toSign: ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.serializeTransaction(returnAssetTx))),
        publicKey: pkp.publicKey.startsWith('0x') ? pkp.publicKey.slice(2) : pkp.publicKey,
        sigName: 'returnSig',
    });

    const signedTx = ethers.utils.serializeTransaction(
        returnAssetTx,
        ethers.utils.joinSignature({
            r: '0x' + JSON.parse(returnSig).r.substring(2),
            s: '0x' + JSON.parse(returnSig).s,
            v: JSON.parse(returnSig).v,
        })
    );

    console.log("signed return tx:", signedTx);
    const txHash = await broadcastTransaction(provider, signedTx);

    // Wait for approval confirmation
    console.log('Waiting for return confirmation...');
    const mintConfirmation = await provider.waitForTransaction(txHash, 1);

    if (mintConfirmation.status === 0) {
        throw new Error('Burn transaction failed');
    }

    return `Return asset transaction hash: ${txHash}`;
};
