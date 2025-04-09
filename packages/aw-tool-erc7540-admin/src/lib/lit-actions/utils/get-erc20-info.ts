/**
 * Retrieves token information (decimals, balance, and parsed amount).
 * @param {any} provider - The Ethereum provider.
 * @returns {Promise<{ decimals: BigNumber, balance: BigNumber, amount: BigNumber }>} Token information.
 */
export async function getTokenInfo(
    provider: any,
    token: string,
    amountIn: string,
    pkpEthAddress: string
) {
    console.log('Getting token info for:', token);

    // Validate token address
    try {
        console.log('Validating token address...');
        ethers.utils.getAddress(token);
    } catch (error) {
        throw new Error(`Invalid token address: ${token}`);
    }

    // Check if contract exists
    console.log('Checking if contract exists...');
    const code = await provider.getCode(token);
    if (code === '0x') {
        throw new Error(`No contract found at address: ${token}`);
    }

    const tokenInterface = new ethers.utils.Interface([
        'function decimals() view returns (uint8)',
        'function balanceOf(address account) view returns (uint256)',
    ]);

    console.log('Creating token contract instance...');
    const tokenContract = new ethers.Contract(
        token,
        tokenInterface,
        provider
    );

    console.log('Fetching token decimals and balance...');
    try {
        const decimals = await tokenContract.decimals();
        const amount = ethers.utils.parseUnits(amountIn, decimals);
        const pkpBalance = await tokenContract.balanceOf(pkpEthAddress);

        console.log('Token decimals:', decimals);
        console.log('Amount to send:', amount.toString());
        console.log('PKP balance:', pkpBalance.toString());

        return { decimals, pkpBalance, amount, token };
    } catch (error) {
        console.error('Error getting token info:', error);
        throw new Error(
            `Failed to interact with token contract at ${token}. Make sure this is a valid ERC20 token contract.`
        );
    }
}
