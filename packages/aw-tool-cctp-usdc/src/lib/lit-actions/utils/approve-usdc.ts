import { CHAIN_IDS_TO_TOKEN_MESSENGER } from './constants';
const tokenInterface = new ethers.utils.Interface([
    'function approve(address spender, uint256 amount) external returns (bool)',
]);

/**
 * Estimates the gas limit for the transaction.
 * @param {any} provider - The Ethereum provider.
 * @param {any} amount - The amount to transfer.
 * @returns {Promise<any>} Estimated gas limit.
 */
const estimateApproveGasLimit = async (
    provider: any,
    tokenIn: string,
    recipientAddress: string,
    amount: any,
    pkp: any
) => {
    console.log(`Estimating gas limit...`);

    const tokenContract = new ethers.Contract(
        tokenIn,
        tokenInterface,
        provider
    );

    try {
        const estimatedGas = await tokenContract.estimateGas.approve(
            recipientAddress,
            amount,
            { from: pkp.ethAddress }
        );
        console.log('Estimated gas limit:', estimatedGas.toString());
        return estimatedGas.mul(120).div(100);
    } catch (error) {
        console.error(
            'Could not estimate gas. Using fallback gas limit of 100000.',
            error
        );
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
const createAndSignApproveTransaction = async (
    tokenIn: string,
    amount: any,
    gasLimit: any,
    gasData: any,
    srcChain: number,
    pkp: any
) => {
    console.log(`Creating and signing transaction...`);

    const approveTx = {
        to: tokenIn,
        data: tokenInterface.encodeFunctionData('approve', [
            CHAIN_IDS_TO_TOKEN_MESSENGER[srcChain],
            amount
        ]),
        value: '0x0',
        gasLimit: gasLimit.toHexString(),
        maxFeePerGas: gasData.maxFeePerGas,
        maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
        nonce: gasData.nonce,
        chainId: srcChain,
        type: 2,
    };

    console.log(`Signing approve with PKP public key: ${pkp.publicKey}...`);
    const approveSig = await Lit.Actions.signAndCombineEcdsa({
        toSign: ethers.utils.arrayify(
            ethers.utils.keccak256(ethers.utils.serializeTransaction(approveTx))
        ),
        publicKey: pkp.publicKey.startsWith('0x')
            ? pkp.publicKey.slice(2)
            : pkp.publicKey,
        sigName: 'approveSig',
    });

    console.log(`Transaction signed`);

    return ethers.utils.serializeTransaction(
        approveTx,
        ethers.utils.joinSignature({
            r: '0x' + JSON.parse(approveSig).r.substring(2),
            s: '0x' + JSON.parse(approveSig).s,
            v: JSON.parse(approveSig).v,
        })
    );
};

export {
    estimateApproveGasLimit,
    createAndSignApproveTransaction,
};