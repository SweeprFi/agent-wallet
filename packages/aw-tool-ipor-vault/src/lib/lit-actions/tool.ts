import {
  fetchToolPolicyFromRegistry,
  getPkpInfo,
  getPkpToolRegistryContract,
  NETWORK_CONFIG,
} from '@lit-protocol/aw-tool';

import { deposit } from './utils/deposit';
import { redeem } from './utils/redeem';
import { values } from './utils/value';

declare global {
  // Required Inputs
  const params: {
    pkpEthAddress: string;
    action: string;
    amount: string;
    vault: string;
    rpcUrl: string;
  };
}

(async () => {
  try {
    console.log(`Using Lit Network: ${LIT_NETWORK}`);
    console.log(`Using PKP Tool Registry Address: ${PKP_TOOL_REGISTRY_ADDRESS}`);
    console.log(
      `Using Pubkey Router Address: ${NETWORK_CONFIG[LIT_NETWORK as keyof typeof NETWORK_CONFIG].pubkeyRouterAddress}`
    );

    const delegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);
    const toolIpfsCid = LitAuth.actionIpfsIds[0];
    const pkpToolRegistryContract = await getPkpToolRegistryContract(PKP_TOOL_REGISTRY_ADDRESS);
    const pkp = await getPkpInfo(params.pkpEthAddress);
    const provider = new ethers.providers.JsonRpcProvider(params.rpcUrl);
    const { chainId } = await provider.getNetwork();

    const toolPolicy = await fetchToolPolicyFromRegistry(
      pkpToolRegistryContract,
      pkp.tokenId,
      delegateeAddress,
      toolIpfsCid
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
        },
      });
    } else {
      console.log(`No policy found for tool ${toolIpfsCid} on PKP ${pkp.tokenId} for delegatee ${delegateeAddress}`);
    }

    let response;

    switch (params.action) {
      case 'deposit':
        response = await deposit(provider, chainId, params.vault, params.amount, pkp);
        break;
      case 'redeem':
        response = await redeem(provider, chainId, params.vault, params.amount, pkp);
        break;
      default:
        response = await values(provider, params.vault, pkp);
        break;
    }

    Lit.Actions.setResponse({
      response: JSON.stringify({
        response: 'Success!',
        status: 'success',
        action: params.action,
        vault: params.vault,
        amount: params.amount,
        data: response,
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