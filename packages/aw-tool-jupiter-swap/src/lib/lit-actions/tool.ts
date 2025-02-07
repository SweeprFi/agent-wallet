import {
  fetchToolPolicyFromRegistry,
  getPkpInfo,
  getPkpToolRegistryContract,
  NETWORK_CONFIG,
} from '@lit-protocol/aw-tool';

import { createSolanaKeypair, createSolanaConnection, getTokenDecimals, toAtomicAmount } from './utils/solana';
import { getJupiterQuote, getJupiterSwapTransaction } from './utils/jupiter';
import { signAndSendTransaction } from './utils/transaction';

declare global {
  // Required Inputs
  const params: {
    pkpEthAddress: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
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
          toolParameters: {
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            amountIn: params.amountIn,
          },
        },
      });
    } else {
      console.log(
        `No policy found for tool ${toolIpfsCid} on PKP ${pkp.tokenId} for delegatee ${delegateeAddress}`
      );
    }

    const accessControlConditions: any = [
      {
        //conditionType: "evmContract",
        contractAddress: "0xBDEd44A02b64416C831A0D82a630488A854ab4b1",
        functionName: "isToolPermittedForDelegatee",
        functionParams: [pkp.tokenId, ":currentActionIpfsId", ":userAddress"],
        functionAbi: {
          name: "isToolPermittedForDelegatee",
          inputs: [
            { name: "pkpTokenId", type: "uint256" },
            { name: "toolIpfsCid", type: "string" },
            { name: "delegatee", type: "address" }
          ],
          outputs: [
            { name: "isPermitted", type: "bool" },
            { name: "isEnabled", type: "bool" }
          ],
          stateMutability: "view",
          type: "function",
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
        //conditionType: "evmContract",
        contractAddress: "0xBDEd44A02b64416C831A0D82a630488A854ab4b1",
        functionName: "isToolPermittedForDelegatee",
        functionParams: [pkp.tokenId, ":currentActionIpfsId", ":userAddress"],
        functionAbi: {
          name: "isToolPermittedForDelegatee",
          inputs: [
            { name: "pkpTokenId", type: "uint256" },
            { name: "toolIpfsCid", type: "string" },
            { name: "delegatee", type: "address" }
          ],
          outputs: [
            { name: "isPermitted", type: "bool" },
            { name: "isEnabled", type: "bool" }
          ],
          stateMutability: "view",
          type: "function",
        },
        chain: "yellowstone",
        returnValueTest: {
          key: "isEnabled", // use the name defined in your ABI
          comparator: "=",
          value: "true"
        }
      },
    ];
    
    const decryptedPrivateKey = await Lit.Actions.decryptAndCombine({
      accessControlConditions,
      ciphertext: params.ciphertext,
      dataToEncryptHash: params.dataToEncryptHash,
      authSig: null,
      chain: "yellowstone",
    });

    const solanaKeyPair = createSolanaKeypair(decryptedPrivateKey);
    const connection = createSolanaConnection();

    const inputDecimals = await getTokenDecimals(connection, params.tokenIn);
    console.log(`Input token decimals: ${inputDecimals}`);
    console.log(`Input amount: ${params.amountIn}`);
    
    const atomicAmount = toAtomicAmount(params.amountIn, inputDecimals);
    console.log(`Atomic amount: ${atomicAmount}`);

    const quoteResponse = await getJupiterQuote({
      inputMint: params.tokenIn,
      outputMint: params.tokenOut,
      amount: atomicAmount,
      slippageBps: "50" // Default 0.5% slippage
    });

    const transaction = await getJupiterSwapTransaction({
      quoteResponse,
      userPublicKey: solanaKeyPair.publicKey.toString()
    });
    transaction.sign([solanaKeyPair]);

    const txid = await signAndSendTransaction(connection, transaction);

    Lit.Actions.setResponse({
      response: `Swap transaction sent Transaction ID: ${txid}`,
      txid
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Lit.Actions.setResponse({
      response: errorMessage,
      txid: null
    });
  }
})();