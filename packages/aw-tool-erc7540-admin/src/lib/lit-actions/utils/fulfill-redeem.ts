import { getGasData } from './get-gas-data';
import { broadcastTransaction } from './broadcast-tx';
import { getTokenInfo } from './get-erc20-info';

const VAULT_INTERFACE = new ethers.utils.Interface([
    'function fulfillRedeem(address controller, uint256 amount) returns (bool)',
    'function asset() view returns (address)'
]);

/**
 * Estimates the gas limit for the transaction.
 * @param {any} contract - The contract object.
 * @param {string} controller - The controller address.
 * @param {any} amount - The amount to transfer.
 * @param {any} pkp - The PKP object.
 */
const estimateFulfillRedeemGasLimit = async (
    contract: any,
    controller: string,
    amount: any,
    pkp: any
) => {
    console.log(`Estimating gas limit...`);

    try {
        const estimatedGas = await contract.estimateGas.fulfillRedeem(controller, amount, { from: pkp.ethAddress });
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
export const fulfillRedeem = async (
    provider: any,
    chainId: number,
    vault: string,
    controller: string,
    amount: any,
    pkp: any
) => {
    console.log(`Creating and signing fulfillRedeem transaction...`);
    const vaultContract = new ethers.Contract(vault, VAULT_INTERFACE, provider);
    const decimals = await vaultContract.decimals();
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);

    console.log(`Creating and signing fulfillRedeem transaction...`);
    const gasLimit = await estimateFulfillRedeemGasLimit(vaultContract, controller, parsedAmount, pkp);
    const gasData = await getGasData(provider, pkp.ethAddress);

    const fulfillRedeemTx = {
        to: vault,
        data: VAULT_INTERFACE.encodeFunctionData('fulfillRedeem', [controller, parsedAmount]),
        value: '0x0',
        gasLimit: gasLimit.toHexString(),
        maxFeePerGas: gasData.maxFeePerGas,
        maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
        nonce: gasData.nonce,
        chainId: chainId,
        type: 2,
    };

    console.log(`Signing fulfillRedeem with PKP public key: ${pkp.publicKey}...`);
    const fulfillRedeemSig = await Lit.Actions.signAndCombineEcdsa({
        toSign: ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.serializeTransaction(fulfillRedeemTx))),
        publicKey: pkp.publicKey.startsWith('0x') ? pkp.publicKey.slice(2) : pkp.publicKey,
        sigName: 'fulfillRedeemSig',
    });

    const signedTx = ethers.utils.serializeTransaction(
        fulfillRedeemTx,
        ethers.utils.joinSignature({
            r: '0x' + JSON.parse(fulfillRedeemSig).r.substring(2),
            s: '0x' + JSON.parse(fulfillRedeemSig).s,
            v: JSON.parse(fulfillRedeemSig).v,
        })
    );

    console.log("signed fulfillRedeem tx:", signedTx);
    const txHash = await broadcastTransaction(provider, signedTx);

    return `FulfillRedeem transaction hash: ${txHash}`;
};
