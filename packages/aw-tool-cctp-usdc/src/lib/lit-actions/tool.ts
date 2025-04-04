import {
  fetchToolPolicyFromRegistry,
  getPkpInfo,
  getPkpToolRegistryContract,
  NETWORK_CONFIG,
} from '@lit-protocol/aw-tool';

import { getGasData } from './utils/get-gas-data';
import { getTokenInfo } from './utils/get-erc20-info';
import { CHAIN_IDS_TO_USDC_ADDRESSES, checkNetwork } from './utils/constants';

import { depositForBurn } from './utils/deposit-for-burn';
import { mintUSDC } from './utils/mint-usdc';

declare global {
  // Required Inputs
  const params: {
    pkpEthAddress: string;
    action: string;
    opChainId: keyof typeof CHAIN_IDS_TO_USDC_ADDRESSES;
    amount: string;
    burnTx: string;
    rpcUrl: string;
  };
}

(async () => {
  try {
    console.log(`Using Lit Network: ${LIT_NETWORK}`);
    console.log(`Using PKP Tool Registry Address: ${PKP_TOOL_REGISTRY_ADDRESS}`);
    console.log(
      `Using Pubkey Router Address: ${NETWORK_CONFIG[LIT_NETWORK as keyof typeof NETWORK_CONFIG]
        .pubkeyRouterAddress
      }`
    );

    const provider = new ethers.providers.JsonRpcProvider(params.rpcUrl);
    const { chainId } = await provider.getNetwork();
    const srcChainId = chainId;
    const dstChainId = params.opChainId;
    const tokenIn = CHAIN_IDS_TO_USDC_ADDRESSES[srcChainId];

    // Validate chain ids
    if (!CHAIN_IDS_TO_USDC_ADDRESSES[srcChainId]) {
      throw new Error(`USDC address not found for chain ${srcChainId}`);
    }

    if (!CHAIN_IDS_TO_USDC_ADDRESSES[dstChainId]) {
      throw new Error(`USDC address not found for chain ${dstChainId}`);
    }

    if (!checkNetwork(Number(srcChainId), Number(dstChainId))) {
      throw new Error(`Mainnet and testnet chains cannot be used in the same transaction`);
    }

    const delegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);
    const toolIpfsCid = LitAuth.actionIpfsIds[0];

    const pkpToolRegistryContract = await getPkpToolRegistryContract(PKP_TOOL_REGISTRY_ADDRESS);
    const pkp = await getPkpInfo(params.pkpEthAddress);

    const toolPolicy = await fetchToolPolicyFromRegistry(
      pkpToolRegistryContract,
      pkp.tokenId,
      delegateeAddress,
      toolIpfsCid
    );

    const tokenInfo = await getTokenInfo(provider, tokenIn, params.amount, pkp.ethAddress);

    if (
      toolPolicy.enabled &&
      toolPolicy.policyIpfsCid !== undefined &&
      toolPolicy.policyIpfsCid !== '0x' &&
      toolPolicy.policyIpfsCid !== ''
    ) {
      console.log(`Executing policy ${toolPolicy.policyIpfsCid}`);
      await Lit.Actions.call({
        ipfsId: toolPolicy.policyIpfsCid,
        params: {
          parentToolIpfsCid: toolIpfsCid,
          pkpToolRegistryContractAddress: PKP_TOOL_REGISTRY_ADDRESS,
          pkpTokenId: pkp.tokenId,
          delegateeAddress,
          toolParameters: params,
          tokenInfo: tokenInfo
        },
      });
    } else {
      console.log(`No policy found for tool ${toolIpfsCid} on PKP ${pkp.tokenId} for delegatee ${delegateeAddress}`);
    }

    let txHash;
    const gasData = await getGasData(provider, pkp.ethAddress);

    switch (params.action) {
      case 'send':
        txHash = await depositForBurn(provider, tokenInfo, srcChainId, dstChainId, pkp, gasData);
        break;
      default:
        txHash = await mintUSDC(provider, params.burnTx, dstChainId, srcChainId, pkp, gasData);
        break;
    }

    Lit.Actions.setResponse({
      response: JSON.stringify({
        response: 'Success!',
        status: 'success',
        data: txHash
      }),
    });
  } catch (err: any) {
    console.error('Error:', err);
    Lit.Actions.setResponse({
      response: JSON.stringify({
        status: 'error',
        error: err.message || String(err),
      }),
    });
  }
})();