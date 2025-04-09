import { getGasData } from './get-gas-data';
import { broadcastTransaction } from './broadcast-tx';

const VAULT_INTERFACE = new ethers.utils.Interface([
    'function asset() view returns (address)',
    'function decimals() view returns (uint8)',
    'function balanceOf(address account) view returns (uint256)',
    'function maxRedeem(address owner) view returns (uint256)',
    'function deposit(uint256 assets, address receiver) returns (uint256)',
    'function redeem(uint256 shares, address receiver, address owner) returns (uint256)'
]);

/**
 * Estimates the gas limit for the transaction.
 * @param {any} contract - The contract object.
 * @param {any} amount - The amount to transfer.
 * @param {any} pkp - The PKP object.
 */
const estimateRedeemGasLimit = async (
    contract: any,
    amount: any,
    pkp: any
) => {
    console.log(`Estimating gas limit...`);

    try {
        const estimatedGas = await contract.estimateGas.redeem(amount, pkp.ethAddress, pkp.ethAddress, { from: pkp.ethAddress });
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
export const redeem = async (
    provider: any,
    chainId: number,
    vault: string,
    amount: any,
    pkp: any
) => {
    console.log(`Creating and signing redeem transaction...`);
    const vaultContract = new ethers.Contract(vault, VAULT_INTERFACE, provider);

    const decimals = await vaultContract.decimals();
    console.log('Token decimals:', decimals);

    let shares = ethers.utils.parseUnits(amount, decimals);
    const maxRedeem = await vaultContract.maxRedeem(pkp.ethAddress);

    // Check if PKP has enough balance
    if(shares.gt(maxRedeem)) {
        shares = maxRedeem;
        console.log(`Shares amount exceeds max redeem. Using max redeem: ${ethers.utils.formatUnits(maxRedeem, decimals)}`);
    }

    console.log(`Creating and signing redeem transaction...`);
    const gasLimit = await estimateRedeemGasLimit(vaultContract, shares, pkp);
    const gasData = await getGasData(provider, pkp.ethAddress);

    const redeemTx = {
        to: vault,
        data: VAULT_INTERFACE.encodeFunctionData('redeem', [shares, pkp.ethAddress, pkp.ethAddress]),
        value: '0x0',
        gasLimit: gasLimit.toHexString(),
        maxFeePerGas: gasData.maxFeePerGas,
        maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
        nonce: gasData.nonce,
        chainId: chainId,
        type: 2,
    };

    console.log(`Signing redeem with PKP public key: ${pkp.publicKey}...`);
    const redeemSig = await Lit.Actions.signAndCombineEcdsa({
        toSign: ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.serializeTransaction(redeemTx))),
        publicKey: pkp.publicKey.startsWith('0x') ? pkp.publicKey.slice(2) : pkp.publicKey,
        sigName: 'redeemSig',
    });

    const signedTx = ethers.utils.serializeTransaction(
        redeemTx,
        ethers.utils.joinSignature({
            r: '0x' + JSON.parse(redeemSig).r.substring(2),
            s: '0x' + JSON.parse(redeemSig).s,
            v: JSON.parse(redeemSig).v,
        })
    );

    console.log("signed redeem tx:", signedTx);
    const txHash = await broadcastTransaction(provider, signedTx);

    return `Redeem transaction hash: ${txHash}`;
};
