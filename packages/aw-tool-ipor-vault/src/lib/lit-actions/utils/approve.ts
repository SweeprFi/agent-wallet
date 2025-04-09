import { getGasData } from './get-gas-data';
import { broadcastTransaction } from './broadcast-tx';

const TOKEN_INTERFACE = new ethers.utils.Interface([
    'function decimals() view returns (uint8)',
    'function balanceOf(address account) view returns (uint256)',
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)'
]);

/**
 * Estimates the gas limit for the transaction.
 * @param {any} provider - The Ethereum provider.
 * @param {string} token - The token address.
 * @param {string} recipientAddress - The recipient address.
 * @param {any} amount - The amount to transfer.
 * @param {any} pkp - The PKP object.
 */
const estimateApproveGasLimit = async (
    provider: any,
    token: string,
    recipientAddress: string,
    amount: any,
    pkp: any
) => {
    console.log(`Estimating gas limit...`);
    const tokenContract = new ethers.Contract(token, TOKEN_INTERFACE, provider);

    try {
        const estimatedGas = await tokenContract.estimateGas.approve(recipientAddress, amount, { from: pkp.ethAddress });
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
 * @param {string} tokenIn - The token address.
 * @param {any} amount - The amount to transfer.
 * @param {number} srcChain - The source chain ID.
 * @param {any} pkp - The PKP object.
 */
export const approveVault = async (
    provider: any,
    token: string,
    vault: string,
    amount: any,
    chainId: number,
    pkp: any
) => {
    const tokenContract = new ethers.Contract(token, TOKEN_INTERFACE, provider);
    const currentAllowance = await tokenContract.allowance(pkp.ethAddress, vault);

    const decimals = await tokenContract.decimals();
    console.log('Token decimals:', decimals);

    const parsedAmount = ethers.utils.parseUnits(amount, decimals);
    const pkpBalance = await tokenContract.balanceOf(pkp.ethAddress);

    // Check if PKP has enough balance
    if (parsedAmount.gt(pkpBalance)) {
        throw new Error(
            `Insufficient balance. PKP balance: ${ethers.utils.formatUnits(
                pkpBalance,
                decimals
            )}. Required: ${ethers.utils.formatUnits(amount, decimals)}`
        );
    }

    const approvalRequired = currentAllowance.lt(parsedAmount);
    let txHash = 'No approval required';

    const gasData = await getGasData(provider, pkp.ethAddress);
    let nonce = gasData.nonce;

    if (approvalRequired) {
        console.log(`Creating and signing approval transaction...`);
        const gasLimit = await estimateApproveGasLimit(provider, token, vault, parsedAmount, pkp);

        const approveTx = {
            to: token,
            data: TOKEN_INTERFACE.encodeFunctionData('approve', [vault, parsedAmount]),
            value: '0x0',
            gasLimit: gasLimit.toHexString(),
            maxFeePerGas: gasData.maxFeePerGas,
            maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
            nonce: nonce,
            chainId: chainId,
            type: 2,
        };

        console.log(`Signing approve with PKP public key: ${pkp.publicKey}...`);
        const approveSig = await Lit.Actions.signAndCombineEcdsa({
            toSign: ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.serializeTransaction(approveTx))),
            publicKey: pkp.publicKey.startsWith('0x') ? pkp.publicKey.slice(2) : pkp.publicKey,
            sigName: 'approveSig',
        });

        const signedTx = ethers.utils.serializeTransaction(
            approveTx,
            ethers.utils.joinSignature({
                r: '0x' + JSON.parse(approveSig).r.substring(2),
                s: '0x' + JSON.parse(approveSig).s,
                v: JSON.parse(approveSig).v,
            })
        );
        console.log("signed approval tx:", signedTx);
        txHash = await broadcastTransaction(provider, signedTx);

        // Wait for approval confirmation
        console.log('Waiting for approval confirmation...');
        const approvalConfirmation = await provider.waitForTransaction(txHash, 1);

        if (approvalConfirmation.status === 0) {
            throw new Error('Approval transaction failed');
        }

        nonce += 1; // Increment nonce for the next transaction
    }

    console.log(`Approval transaction hash: ${txHash}`);
    return { parsedAmount, gasData, nonce };
};
