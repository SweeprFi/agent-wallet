import {
  fetchToolPolicyFromRegistry,
  getPkpInfo,
  getPkpToolRegistryContract,
  NETWORK_CONFIG,
} from '@lit-protocol/aw-tool';

import { signMessage } from './utils/sign-message';

declare global {
  // Required Inputs
  const params: {
    pkpEthAddress: string;
    message: string;
    ciphertext: string;
    dataToEncryptHash: string;
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

    const accessControlConditions: any = [
      {
        contractAddress: "0xBDEd44A02b64416C831A0D82a630488A854ab4b1",
        functionName: "isToolPermittedForDelegatee",
        functionParams: [pkp.tokenId, ":currentActionIpfsId", ":userAddress"],
        functionAbi: {
          type: "function",
          stateMutability: "view",
          name: "isToolPermittedForDelegatee",
          inputs: [
            { type: "uint256", name: "pkpTokenId" },
            { type: "string", name: "toolIpfsCid" },
            { type: "address", name: "delegatee" }
          ],
          outputs: [
            { type: "bool", name: "isPermitted" },
            { type: "bool", name: "isEnabled" }
          ]
        },
        chain: "yellowstone",
        returnValueTest: {
          key: "isPermitted", // use the name defined in your ABI
          comparator: "=",
          value: "true"
        }
      },
      {"operator": "and"},
      {
        contractAddress: "0xBDEd44A02b64416C831A0D82a630488A854ab4b1",
        functionName: "isToolPermittedForDelegatee",
        functionParams: [pkp.tokenId, ":currentActionIpfsId", ":userAddress"],
        functionAbi: {
          type: "function",
          stateMutability: "view",
          name: "isToolPermittedForDelegatee",
          inputs: [
            { type: "uint256", name: "pkpTokenId" },
            { type: "string", name: "toolIpfsCid" },
            { type: "address", name: "delegatee" }
          ],
          outputs: [
            { type: "bool", name: "isPermitted" },
            { type: "bool", name: "isEnabled" }
          ]
        },
        chain: "yellowstone",
        returnValueTest: {
          key: "isEnabled", // use the name defined in your ABI
          comparator: "=",
          value: "true"
        }
      },
    ];
    
    const signature = await signMessage({
      accessControlConditions: accessControlConditions,
      ciphertext: params.ciphertext,
      dataToEncryptHash: params.dataToEncryptHash,
      message: params.message,
    });

    console.log('Signature:', signature);

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