import {
  fetchToolPolicyFromRegistry,
  getPkpInfo,
  getPkpToolRegistryContract,
  NETWORK_CONFIG,
} from '@lit-protocol/aw-tool';

import { getTokenInfo } from './utils/get-erc20-info';
import { CHAIN_IDS_TO_USDC_ADDRESSES, CHAIN_IDS_TO_TOKEN_MESSENGER } from './utils/constants';

import { getGasData } from './utils/get-gas-data';
import { broadcastTransaction } from './utils/broadcast-tx';
import {
  estimateApproveGasLimit,
  createAndSignApproveTransaction
} from './utils/approve-usdc';
import {
  estimateDepositForBurnGasLimit,
  createAndSignDepositForBurnTransaction
} from './utils/deposit-for-burn';
import { retrieveAttestation } from './utils/retrieve-attestation';
import {
  estimateMintUSDCGasLimit,
  createAndSignMintUSDCTransaction,
} from './utils/mint-usdc';

declare global {
  // Required Inputs
  const params: {
    pkpEthAddress: string;
    rpcSrcUrl: string;
    rpcDstUrl: string;
    srcChain: keyof typeof CHAIN_IDS_TO_USDC_ADDRESSES;
    dstChain: keyof typeof CHAIN_IDS_TO_USDC_ADDRESSES;
    amount: string;
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

    const tokenIn = CHAIN_IDS_TO_USDC_ADDRESSES[params.srcChain];
    const delegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);
    const toolIpfsCid = LitAuth.actionIpfsIds[0];

    const srcProvider = new ethers.providers.JsonRpcProvider(params.rpcSrcUrl);
    const dstProvider = new ethers.providers.JsonRpcProvider(params.rpcDstUrl);
    const balanceDst = await dstProvider.getBalance(params.pkpEthAddress);

    const pkpToolRegistryContract = await getPkpToolRegistryContract(
      PKP_TOOL_REGISTRY_ADDRESS
    );
    const pkp = await getPkpInfo(params.pkpEthAddress);

    const toolPolicy = await fetchToolPolicyFromRegistry(
      pkpToolRegistryContract,
      pkp.tokenId,
      delegateeAddress,
      toolIpfsCid
    );

    const tokenSrcInfo = await getTokenInfo(
      srcProvider,
      tokenIn,
      params.amount,
      pkp.ethAddress
    );

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
      console.log(
        `No policy found for tool ${toolIpfsCid} on PKP ${pkp.tokenId} for delegatee ${delegateeAddress}`
      );
    }

    let gasData = await getGasData(srcProvider, pkp.ethAddress);

    // Approve USDC token
    console.log(`Approving USDC token...`);
    let gasLimit = await estimateApproveGasLimit(
      srcProvider,
      tokenIn,
      params.pkpEthAddress,
      tokenSrcInfo.amount,
      pkp.ethAddress
    );
    let signedTx = await createAndSignApproveTransaction(
      tokenIn,
      tokenSrcInfo.amount,
      gasLimit,
      gasData,
      params.srcChain,
      pkp
    );

    console.log("signed approval tx:", signedTx);
    let txHash = await broadcastTransaction(srcProvider, signedTx);
    console.log(`Approval transaction hash: ${txHash}`);

    // VERIFYING ------------------------------------------------
    const tokenInterface = new ethers.utils.Interface(['function allowance(address owner, address spender) view returns (uint256)']);
    const tokenContract = new ethers.Contract(tokenIn, tokenInterface, srcProvider);
    const amt = await tokenContract.allowance(pkp.ethAddress, CHAIN_IDS_TO_TOKEN_MESSENGER[params.srcChain])
    console.log("Approved amount after tx:", amt.toString());
    // ------------------------------------------------------------

    // Burn USDC token
    console.log(`Depositing USDC token for burn...`);
    gasLimit = await estimateDepositForBurnGasLimit(
      srcProvider,
      tokenSrcInfo.amount,
      params.srcChain,
      params.dstChain,
      pkp.ethAddress
    );
    signedTx = await createAndSignDepositForBurnTransaction(
      tokenSrcInfo.amount,
      gasLimit,
      gasData,
      params.srcChain,
      params.dstChain,
      pkp
    );

    txHash = await broadcastTransaction(srcProvider, signedTx);
    console.log(`DepositForBurn transaction hash: ${txHash}`);

    // Retrieve attestation
    const sourceChainId = params.srcChain;
    const attestation = await retrieveAttestation(txHash, sourceChainId);
    console.log(`Attestation: ${JSON.stringify(attestation)}`);

    const minBalance = ethers.utils.parseUnits("0.01"); // 0.01 native token
    if (balanceDst < minBalance) {
      throw new Error("Insufficient native token for gas fees");
    }

    // Mint USDC token on destination chain
    console.log(`Minting USDC token on destination chain...`);
    gasData = await getGasData(dstProvider, pkp.ethAddress);
    gasLimit = await estimateMintUSDCGasLimit(
      dstProvider,
      pkp.ethAddress,
      params.dstChain,
      attestation
    );
    signedTx = await createAndSignMintUSDCTransaction(
      gasLimit,
      gasData,
      params.dstChain,
      attestation,
      pkp
    );
    txHash = await broadcastTransaction(dstProvider, signedTx);

    // Set response
    console.log(`Mint transaction hash: ${txHash}`);

    Lit.Actions.setResponse({
      response: JSON.stringify({
        response: 'Success!',
        status: 'success',
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