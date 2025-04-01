import { getGasData } from './get-gas-data';
import { broadcastTransaction } from './broadcast-tx';
import { CHAIN_IDS_TO_MESSAGE_TRANSMITTER } from './constants';

const CCPT_INTERFACE = new ethers.utils.Interface([
    'function receiveMessage(bytes message, bytes attestation) external',
]);

/**
 * Estimates the gas limit for the transaction.
 * @param {any} provider - The Ethereum provider.
 * @param {any} amount - The amount to transfer.
 * @returns {Promise<any>} Estimated gas limit.
 */
const estimateMintUSDCGasLimit = async (
    provider: any,
    pkpEthAddress: string,
    dstChain: number,
    attestation: any
) => {
    console.log(`Estimating gas limit...`);
    const cctpContract = new ethers.Contract(CHAIN_IDS_TO_MESSAGE_TRANSMITTER[dstChain], CCPT_INTERFACE, provider);

    try {
        const estimatedGas = await cctpContract.estimateGas.receiveMessage(
            attestation.message,
            attestation.attestation,
            { from: pkpEthAddress }
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
 * @param {any} gasLimit - The gas limit for the transaction.
 * @param {any} amount - The amount to transfer.
 * @param {any} gasData - Gas data (maxFeePerGas, maxPriorityFeePerGas, nonce).
 * @returns {Promise<string>} The signed transaction.
 */
export const mintUSDC = async (    
    provider: any,
    dstChain: number,
    attestation: any,
    pkp: any
) => {
    // dstProvider, params.dstChain, attestation, pkp
    console.log(`Creating and signing transaction...`);
    const gasLimit = await estimateMintUSDCGasLimit(provider, pkp.ethAddress, dstChain, attestation);
    const gasData = await getGasData(provider, pkp.ethAddress);

    const mintTx = {
        to: CHAIN_IDS_TO_MESSAGE_TRANSMITTER[dstChain],
        data: CCPT_INTERFACE.encodeFunctionData('receiveMessage', [attestation.message, attestation.attestation]),
        value: '0x0',
        gasLimit: gasLimit.toHexString(),
        maxFeePerGas: gasData.maxFeePerGas,
        maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
        nonce: gasData.nonce,
        chainId: dstChain,
        type: 2,
    };

    console.log(`Signing mint with PKP public key: ${pkp.publicKey}...`);
    const mintSig = await Lit.Actions.signAndCombineEcdsa({
        toSign: ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.serializeTransaction(mintTx))),
        publicKey: pkp.publicKey.startsWith('0x') ? pkp.publicKey.slice(2) : pkp.publicKey,
        sigName: 'mintSig',
    });

    const signedTx = ethers.utils.serializeTransaction(
        mintTx,
        ethers.utils.joinSignature({
            r: '0x' + JSON.parse(mintSig).r.substring(2),
            s: '0x' + JSON.parse(mintSig).s,
            v: JSON.parse(mintSig).v,
        })
    );

    console.log("signed approval tx:", signedTx);
    const txHash = await broadcastTransaction(provider, signedTx);
    console.log(`Mint transaction hash: ${txHash}`);
};
