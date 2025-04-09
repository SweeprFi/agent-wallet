import { broadcastTransaction } from './broadcast-tx';
import { getTokenInfo } from './get-erc20-info';

const VAULT_INTERFACE = new ethers.utils.Interface([
    'function fulfillDeposit(address controller, uint256 amount) returns (bool)',
    'function asset() view returns (address)',
]);

/**
 * Estimates the gas limit for the transaction.
 * @param {any} provider - The Ethereum provider.
 * @param {string} vault - The vault address.
 * @param {string} controller - The controller address.
 * @param {any} amount - The amount to transfer.
 * @param {any} pkp - The PKP object.
 */
const estimateFulfillDepositGasLimit = async (
    provider: any,
    vault: string,
    controller: string,
    amount: any,
    pkp: any
) => {
    console.log(`Estimating gas limit...`);
    const vaultContract = new ethers.Contract(vault, VAULT_INTERFACE, provider);

    try {
        const estimatedGas = await vaultContract.estimateGas.fulfillDeposit(controller, amount, { from: pkp.ethAddress });
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
export const fulfillDeposit = async (
    provider: any,
    chainId: number,
    vault: string,
    controller: string,
    amount: any,
    pkp: any,
    gasData: { maxFeePerGas: string; maxPriorityFeePerGas: string },
    nonce: number
) => {
    const vaultContract = new ethers.Contract(vault, VAULT_INTERFACE, provider);
    const asset = await vaultContract.asset();
    const tokenInfo = await getTokenInfo(provider, asset, amount, pkp.ethAddress);

    console.log(`Creating and signing fulfillDeposit transaction...`);
    const gasLimit = await estimateFulfillDepositGasLimit(provider, vault, controller, tokenInfo.amount, pkp);

    const fulfillDepositTx = {
        to: vault,
        data: VAULT_INTERFACE.encodeFunctionData('fulfillDeposit', [controller, tokenInfo.amount]),
        value: '0x0',
        gasLimit: gasLimit.toHexString(),
        maxFeePerGas: gasData.maxFeePerGas,
        maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
        nonce: nonce,
        chainId: chainId,
        type: 2,
    };

    console.log(`Signing fulfillDeposit with PKP public key: ${pkp.publicKey}...`);
    const fulfillDepositSig = await Lit.Actions.signAndCombineEcdsa({
        toSign: ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.serializeTransaction(fulfillDepositTx))),
        publicKey: pkp.publicKey.startsWith('0x') ? pkp.publicKey.slice(2) : pkp.publicKey,
        sigName: 'fulfillDepositSig',
    });

    const signedTx = ethers.utils.serializeTransaction(
        fulfillDepositTx,
        ethers.utils.joinSignature({
            r: '0x' + JSON.parse(fulfillDepositSig).r.substring(2),
            s: '0x' + JSON.parse(fulfillDepositSig).s,
            v: JSON.parse(fulfillDepositSig).v,
        })
    );

    console.log("signed fulfillDeposit tx:", signedTx);
    const txHash = await broadcastTransaction(provider, signedTx);

    return `FulfillDeposit transaction hash: ${txHash}`;
};
