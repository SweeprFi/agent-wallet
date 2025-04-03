import { broadcastTransaction } from './broadcast-tx';
import { approveVault } from './approve';

const VAULT_INTERFACE = new ethers.utils.Interface([
    'function asset() view returns (address)',
    'function decimals() view returns (uint8)',
    'function balanceOf(address account) view returns (uint256)',
    'function deposit(uint256 assets, address receiver) returns (uint256)',
    'function redeem(uint256 shares, address receiver, address owner) returns (uint256)'
]);

/**
 * Estimates the gas limit for the transaction.
 * @param {any} provider - The Ethereum provider.
 * @param {string} vault - The vault address.
 * @param {any} amount - The amount to transfer.
 * @param {any} pkp - The PKP object.
 */
const estimateDepositGasLimit = async (
    provider: any,
    vault: string,
    amount: any,
    pkp: any
) => {
    console.log(`Estimating gas limit...`);
    const vaultContract = new ethers.Contract(vault, VAULT_INTERFACE, provider);

    try {
        const estimatedGas = await vaultContract.estimateGas.deposit(amount, pkp.ethAddress, { from: pkp.ethAddress });
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
 */
export const deposit = async (
    provider: any,
    chainId: number,
    vault: string,
    amount: any,
    pkp: any,
) => {
    const vaultContract = new ethers.Contract(vault, VAULT_INTERFACE, provider);
    const asset = await vaultContract.asset();
    let { parsedAmount, gasData } = await approveVault(provider, asset, vault, amount, chainId, pkp);

    console.log(`Creating and signing deposit transaction...`);
    const gasLimit = await estimateDepositGasLimit(provider, vault, parsedAmount, pkp);

    const depositTx = {
        to: vault,
        data: VAULT_INTERFACE.encodeFunctionData('deposit', [parsedAmount, pkp.ethAddress]),
        value: '0x0',
        gasLimit: gasLimit.toHexString(),
        maxFeePerGas: gasData.maxFeePerGas,
        maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
        nonce: gasData.nonce + 1,
        chainId: chainId,
        type: 2,
    };

    console.log(`Signing deposit with PKP public key: ${pkp.publicKey}...`);
    const depositSig = await Lit.Actions.signAndCombineEcdsa({
        toSign: ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.serializeTransaction(depositTx))),
        publicKey: pkp.publicKey.startsWith('0x') ? pkp.publicKey.slice(2) : pkp.publicKey,
        sigName: 'depositSig',
    });

    const signedTx = ethers.utils.serializeTransaction(
        depositTx,
        ethers.utils.joinSignature({
            r: '0x' + JSON.parse(depositSig).r.substring(2),
            s: '0x' + JSON.parse(depositSig).s,
            v: JSON.parse(depositSig).v,
        })
    );

    console.log("signed deposit tx:", signedTx);
    const txHash = await broadcastTransaction(provider, signedTx);

    return `Deposit transaction hash: ${txHash}`;
};
