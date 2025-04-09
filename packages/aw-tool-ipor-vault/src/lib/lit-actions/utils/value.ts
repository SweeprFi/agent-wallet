const VAULT_INTERFACE = new ethers.utils.Interface([
    'function decimals() view returns (uint8)',
    'function asset() view returns (address)',
    'function balanceOf(address account) view returns (uint256)',
    'function convertToAssets(uint256 shares) view returns (uint256)',
]);

const TOKEN_INTERFACE = new ethers.utils.Interface([
    'function decimals() view returns (uint8)',
]);

/**
 * Creates and signs the transaction.
 * @param {any} provider - The Ethereum provider.
 * @param {string} vault - The vault address.
 * @param {any} pkp - The PKP object.
 */
export const values = async (
    provider: any,
    vault: string,
    pkp: any
) => {
    let assets;
    let shares;

    console.log(`Getting values for vault ${vault}...`);
    const vaultContract = new ethers.Contract(vault, VAULT_INTERFACE, provider);
    const assetAddress = await vaultContract.asset();
    const assetContract = new ethers.Contract(assetAddress, TOKEN_INTERFACE, provider);
    
    const shareDecimals = await vaultContract.decimals();
    const assetDecimals = await assetContract.decimals();

    shares = await vaultContract.balanceOf(pkp.ethAddress);
    assets = await vaultContract.convertToAssets(shares);

    console.log('Assets:', assets.toString());
    console.log('Shares:', shares.toString());

    return {
        assets: ethers.utils.formatUnits(assets, assetDecimals),
        shares: ethers.utils.formatUnits(shares, shareDecimals),
    };
}