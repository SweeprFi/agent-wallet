import { broadcastTransaction } from './broadcast-tx';
import { retrieveAttestation } from './retrieve-attestation';
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
 * @param {any} provider - The Ethereum provider.
 * @param {string} burnTx - The burn transaction hash.
 * @param {number} srcChainId - The source chain ID.
 * @param {number} dstChainId - The destination chain ID.
 * @param {any} pkp - The PKP object.
 * @param {any} gasData - Gas data (maxFeePerGas, maxPriorityFeePerGas, nonce).
 * @returns {Promise<string>} The signed transaction.
 */
export const mintUSDC = async (    
    provider: any,
    burnTx: string,
    srcChainId: number,
    dstChainId: number,
    pkp: any,
    gasData: any
) => {
    // Retrieve attestation ------------------------------------------------------
    const attestation = await retrieveAttestation(burnTx, srcChainId);
    console.log(`Attestation: ${JSON.stringify(attestation)}`);

    const balanceDst = await provider.getBalance(pkp.ethAddress);
    const minBalance = ethers.utils.parseUnits("0.01"); // 0.01 native token
    if (balanceDst < minBalance) {
      throw new Error("Insufficient native token for gas fees");
    }

    console.log(`Creating and signing mint transaction...`);
    const gasLimit = await estimateMintUSDCGasLimit(provider, pkp.ethAddress, dstChainId, attestation);

    const mintTx = {
        to: CHAIN_IDS_TO_MESSAGE_TRANSMITTER[dstChainId],
        data: CCPT_INTERFACE.encodeFunctionData('receiveMessage', [attestation.message, attestation.attestation]),
        value: '0x0',
        gasLimit: gasLimit.toHexString(),
        maxFeePerGas: gasData.maxFeePerGas,
        maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
        nonce: gasData.nonce,
        chainId: dstChainId,
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

    console.log("signed mint tx:", signedTx);
    const txHash = await broadcastTransaction(provider, signedTx);
    console.log(`Mint transaction hash: ${txHash}`);

    // Wait for approval confirmation
    console.log('Waiting for mint confirmation...');
    const mintConfirmation = await provider.waitForTransaction(txHash, 1);

    if (mintConfirmation.status === 0) {
        throw new Error('Burn transaction failed');
    }

    return txHash;
};
