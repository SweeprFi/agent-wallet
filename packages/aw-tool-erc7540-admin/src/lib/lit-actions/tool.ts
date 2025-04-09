import {
  fetchToolPolicyFromRegistry,
  getPkpInfo,
  getPkpToolRegistryContract,
  NETWORK_CONFIG,
} from '@lit-protocol/aw-tool';

import { getGasData } from './utils/get-gas-data';
import { fulfillDeposit } from './utils/fulfiill-deposit';
import { fulfillRedeem } from './utils/fulfill-redeem';
import { takeAssets } from './utils/take-assets';
import { returnAssets } from './utils/return-assets';
import { updateInvestedTotal } from './utils/update-invested-total';

declare global {
  // Required Inputs
  const params: {
    pkpEthAddress: string;
    controller: string;
    amount: string;
    action: string;
    vault: string;
    rpcUrl: string;
  };
}

(async () => {
  try {
    console.log(`Using Lit Network: ${LIT_NETWORK}`);
    console.log(
      `Using PKP Tool Registry Address: ${PKP_TOOL_REGISTRY_ADDRESS}`
    );
    console.log(
      `Using Pubkey Router Address: ${
        NETWORK_CONFIG[LIT_NETWORK as keyof typeof NETWORK_CONFIG]
          .pubkeyRouterAddress
      }`
    );

    const delegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);
    const toolIpfsCid = LitAuth.actionIpfsIds[0];
    const pkpToolRegistryContract = await getPkpToolRegistryContract(
      PKP_TOOL_REGISTRY_ADDRESS
    );
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
      console.log(
        `No policy found for tool ${toolIpfsCid} on PKP ${pkp.tokenId} for delegatee ${delegateeAddress}`
      );
    }

    let response;
    const gasData = await getGasData(provider, pkp.ethAddress);

    switch (params.action) {
      case 'fulfillDeposit':
        response = await fulfillDeposit(provider, chainId, params.vault, params.controller, params.amount, pkp, gasData);
        break;
      case 'fulfillRedeem':
          response = await fulfillRedeem(provider, chainId, params.vault, params.controller, params.amount, pkp, gasData);
        break;
      case 'takeAssets':
        response = await takeAssets(provider, chainId, params.vault, params.amount, pkp, gasData);
        break;
        case 'returnAssets':
        response = await returnAssets(provider, chainId, params.vault, params.amount, pkp, gasData);
        break;
      default:
        response = await updateInvestedTotal(provider, chainId, params.vault, params.amount, pkp, gasData);
        break;
    }

    Lit.Actions.setResponse({
      response: JSON.stringify({
        response: 'Success!',
        status: 'success',
        controller: params.controller,
        vault: params.vault,
        amount: params.amount,
        action: params.action,
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