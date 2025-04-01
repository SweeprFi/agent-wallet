import { BigNumber } from 'ethers';
import { getGasData } from './get-gas-data';
import { broadcastTransaction } from './broadcast-tx';
import { CHAIN_IDS_TO_TOKEN_MESSENGER, CHAIN_IDS_TO_USDC_ADDRESSES, DESTINATION_DOMAINS } from './constants';

const CCPT_INTERFACE = new ethers.utils.Interface([
    'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 hookData, uint256 maxFee, uint32 finalityThreshold) external',
]);

/**
 * Estimates the gas limit for the transaction.
 * @param {any} provider - The Ethereum provider.
 * @param {BigNumber} amount - The amount to transfer.
 * @param {number} srcChain - The source chain ID.
 * @param {number} dstChain - The destination chain ID.
 * @param {any} pkp - The PKP object.
 */
const estimateDepositForBurnGasLimit = async (
    provider: any,
    amount: BigNumber,
    srcChain: number,
    dstChain: number,
    pkp: any
) => {
    console.log(`Estimating gas limit...`);
    const cctpContract = new ethers.Contract(CHAIN_IDS_TO_TOKEN_MESSENGER[srcChain], CCPT_INTERFACE, provider);
    const burnRecipient = `0x${pkp.ethAddress.replace(/^0x/, "").padStart(64, "0")}`;

    try {
        const estimatedGas = await cctpContract.estimateGas.depositForBurn(
            amount,
            DESTINATION_DOMAINS[dstChain],
            burnRecipient,
            CHAIN_IDS_TO_USDC_ADDRESSES[srcChain],
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            amount.sub(BigNumber.from(1)),
            1000,
            { from: pkp.ethAddress }
        );
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
 * @param {BigNumber} amount - The amount to transfer.
 * @param {number} srcChain - The source chain ID.
 * @param {number} dstChain - The destination chain ID.
 * @param {any} pkp - The PKP object.
 */
export const depositForBurn = async (
    provider: any,
    amount: BigNumber,
    srcChain: number,
    dstChain: number,
    pkp: any
) => {
    console.log(`Creating and signing transaction...`);
    const burnRecipient = `0x${pkp.ethAddress.replace(/^0x/, "").padStart(64, "0")}`;
    const gasLimit = await estimateDepositForBurnGasLimit(provider, amount, srcChain, dstChain, pkp);
    const gasData = await getGasData(provider, pkp.ethAddress);

    const depositForBurnTx = {
        to: CHAIN_IDS_TO_TOKEN_MESSENGER[srcChain],
        data: CCPT_INTERFACE.encodeFunctionData('depositForBurn', [
            amount,
            DESTINATION_DOMAINS[dstChain],
            burnRecipient,
            CHAIN_IDS_TO_USDC_ADDRESSES[srcChain],
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            amount.sub(BigNumber.from(1)),
            1000,
        ]),
        value: '0x0',
        gasLimit: gasLimit.toHexString(),
        maxFeePerGas: gasData.maxFeePerGas,
        maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
        nonce: gasData.nonce,
        chainId: srcChain,
        type: 2,
    };

    console.log(`Signing deposit with PKP public key: ${pkp.publicKey}...`);
    const depositSig = await Lit.Actions.signAndCombineEcdsa({
        toSign: ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.serializeTransaction(depositForBurnTx))),
        publicKey: pkp.publicKey.startsWith('0x') ? pkp.publicKey.slice(2) : pkp.publicKey,
        sigName: 'depositForBurnSig',
    });

    const signedTx = ethers.utils.serializeTransaction(
        depositForBurnTx,
        ethers.utils.joinSignature({
            r: '0x' + JSON.parse(depositSig).r.substring(2),
            s: '0x' + JSON.parse(depositSig).s,
            v: JSON.parse(depositSig).v,
        })
    );
    console.log("signed approval tx:", signedTx);
    const txHash = await broadcastTransaction(provider, signedTx);
    console.log(`DepositForBurn transaction hash: ${txHash}`);
};
