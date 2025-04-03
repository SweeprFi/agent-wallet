import {
  fetchToolPolicyFromRegistry,
  getPkpInfo,
  getPkpToolRegistryContract,
  NETWORK_CONFIG,
} from '@lit-protocol/aw-tool';

import { getGasData } from './utils/get-gas-data';

import { getTokenInfo } from './utils/get-erc20-info';
import { CHAIN_IDS_TO_USDC_ADDRESSES, checkNetwork } from './utils/constants';

import { approveUSDC } from './utils/approve-usdc';
import { depositForBurn } from './utils/deposit-for-burn';
import { retrieveAttestation } from './utils/retrieve-attestation';
import { mintUSDC } from './utils/mint-usdc';

declare global {
  // Required Inputs
  const params: {
    pkpEthAddress: string;
    rpcSrcUrl: string;
    rpcDstUrl: string;
    srcChain: keyof typeof CHAIN_IDS_TO_USDC_ADDRESSES;
    dstChain: keyof typeof CHAIN_IDS_TO_USDC_ADDRESSES;
    amount: string;
    burnTx: string;
  };
}

(async () => {
  try {
    console.log(`Using Lit Network: ${LIT_NETWORK}`);
    console.log(
      `Using PKP Tool Registry Address: ${PKP_TOOL_REGISTRY_ADDRESS}`
    );
    console.log(
      `Using Pubkey Router Address: ${NETWORK_CONFIG[LIT_NETWORK as keyof typeof NETWORK_CONFIG]
        .pubkeyRouterAddress
      }`
    );

    // Validate chain ids
    if (!CHAIN_IDS_TO_USDC_ADDRESSES[params.srcChain]) {
      throw new Error(`USDC address not found for chain ${params.srcChain}`);
    }

    if (!CHAIN_IDS_TO_USDC_ADDRESSES[params.dstChain]) {
      throw new Error(`USDC address not found for chain ${params.dstChain}`);
    }

    if(!checkNetwork(params.srcChain, params.dstChain)) {
      throw new Error(`Mainnet and testnet chains cannot be used in the same transaction`);
    }

    const tokenIn = CHAIN_IDS_TO_USDC_ADDRESSES[params.srcChain];
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

    const srcProvider = new ethers.providers.JsonRpcProvider(params.rpcSrcUrl);
    const dstProvider = new ethers.providers.JsonRpcProvider(params.rpcDstUrl);
    const balanceDst = await dstProvider.getBalance(pkp.ethAddress);
    const tokenSrcInfo = await getTokenInfo(srcProvider, tokenIn, params.amount, pkp.ethAddress);

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
          tokenInfo: tokenSrcInfo
        },
      });
    } else {
      console.log(`No policy found for tool ${toolIpfsCid} on PKP ${pkp.tokenId} for delegatee ${delegateeAddress}`);
    }

    let gasData = await getGasData(srcProvider, pkp.ethAddress);

    let burnTxHash = params.burnTx;
    if (!burnTxHash) {
      // Approve USDC token ------------------------------------------------------
      await approveUSDC(srcProvider, tokenIn, tokenSrcInfo.amount, params.srcChain, pkp, gasData);      
      // Deposit for Burn USDC token ---------------------------------------------
      burnTxHash = await depositForBurn(srcProvider, tokenSrcInfo.amount, params.srcChain, params.dstChain, pkp, gasData);
    }

    // Retrieve attestation ------------------------------------------------------
    const attestation = await retrieveAttestation(burnTxHash, params.srcChain); // TODO: Add attestation to Lit.Actions.setResponse
    console.log(`Attestation: ${JSON.stringify(attestation)}`);
        
    const minBalance = ethers.utils.parseUnits("0.01"); // 0.01 native token
    if (balanceDst < minBalance) {
      throw new Error("Insufficient native token for gas fees");
    }

    // Mint USDC token on destination chain
    await mintUSDC(dstProvider, params.dstChain, attestation, pkp);

    Lit.Actions.setResponse({
      response: JSON.stringify({ response: 'Success!', status: 'success', }),
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