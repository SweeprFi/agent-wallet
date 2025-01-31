import {
  fetchToolPolicyFromRegistry,
  getPkpInfo,
  getPkpToolRegistryContract,
  NETWORK_CONFIG,
} from '@lit-protocol/aw-tool';
import { ENSO_API_KEY, ENSO_SUPPORTED_CHAINS } from 'src/constants';
import { getToken } from './utils/get-token';
import { EnsoClient } from '@ensofinance/sdk';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { getRoute } from './utils/get-route';

declare global {
  // Required Inputs
  const params: {
    pkpEthAddress: string;
    chainId: string;
    rpcUrl: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
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
    if (ENSO_SUPPORTED_CHAINS.has(Number(params.chainId))) {
      throw new Error(`ChainId ${params.chainId} is not supported by Enso`);
    }

    const delegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);
    const toolIpfsCid = LitAuth.actionIpfsIds[0];
    const ensoClient = new EnsoClient({ apiKey: ENSO_API_KEY });
    const chainId = Number(params.chainId);
    const provider = new ethers.providers.JsonRpcProvider(params.rpcUrl);

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

    const tokenInData = await getToken(ensoClient, chainId, params.tokenIn);
    const amountInWei = parseUnits(
      params.amountIn,
      tokenInData.decimals
    ).toString();

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
          toolParameters: {
            amountIn: amountInWei,
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
          },
        },
      });
    } else {
      console.log(
        `No policy found for tool ${toolIpfsCid} on PKP ${pkp.tokenId} for delegatee ${delegateeAddress}`
      );
    }

    // Add your tool execution logic here
    const routeData = await getRoute(
      ensoClient,
      chainId,
      pkp.ethAddress,
      params.tokenIn,
      amountInWei,
      params.tokenOut
    );

    // TODO: What needs to be done:
    // 1. Need to do approval if necessary
    // 2. Do the routing

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

