const VAULT_INTERFACE = new ethers.utils.Interface([
    'function totalPendingDepositAssets() view returns (uint256)',
    'function totalPendingRedeemShares() view returns (uint256)',
    'function asset() view returns (address)',
    'function convertToAssets(uint256 shares) view returns (uint256)',
    'function decimals() view returns (uint8)'
]);

const ERC20_INTERFACE = new ethers.utils.Interface([
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)'
]);

/**
 * Reads and displays various values from the vault contract.
 * @param {any} provider - The Ethereum provider.
 * @param {string} vault - The vault address.
 */
export const readVaultValues = async (
    provider: any,
    vault: string
) => {
    console.log(`Reading vault values...`);
    
    // Get vault contract
    const vaultContract = new ethers.Contract(vault, VAULT_INTERFACE, provider);
    const vaultDecimals = await vaultContract.decimals();

    // Get asset address and its balance
    const assetAddress = await vaultContract.asset();
    const assetContract = new ethers.Contract(assetAddress, ERC20_INTERFACE, provider);
    const assetDecimals = await assetContract.decimals();
    const vaultAssetBalance = await assetContract.balanceOf(vault);

    // Get pending deposits and redeems
    const pendingDeposits = await vaultContract.totalPendingDepositAssets();
    const pendingRedeems = await vaultContract.totalPendingRedeemShares();
    
    console.log('Vault asset balance:', ethers.utils.formatUnits(vaultAssetBalance, assetDecimals));
    console.log('Total pending deposit assets:', ethers.utils.formatUnits(pendingDeposits, assetDecimals));
    console.log('Total pending redeem shares:', ethers.utils.formatUnits(pendingRedeems, vaultDecimals));

    // Convert pending redeem shares to assets
    const pendingRedeemAssets = await vaultContract.convertToAssets(pendingRedeems);
    console.log('Pending redeem shares converted to assets:', ethers.utils.formatUnits(pendingRedeemAssets, vaultDecimals));

    return {
        pendingDeposits: ethers.utils.formatUnits(pendingDeposits, assetDecimals),
        pendingRedeems: ethers.utils.formatUnits(pendingRedeems, vaultDecimals),
        vaultAssetBalance: ethers.utils.formatUnits(vaultAssetBalance, assetDecimals),
        pendingRedeemAssets: ethers.utils.formatUnits(pendingRedeemAssets, assetDecimals)
    };
};
