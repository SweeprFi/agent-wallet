import {
  fetchToolPolicyFromRegistry,
  getPkpInfo,
  getPkpToolRegistryContract,
  NETWORK_CONFIG,
} from '@lit-protocol/aw-tool';

import {
  signAndSendTransaction,
  getJupiterQuote,
  getJupiterSwapTransaction,
  createSolanaKeypair,
  createSolanaConnection,
  getTokenDecimals,
  toAtomicAmount
} from './utils';

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
            amountIn: params.amountIn,
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

    const solanaKeyPair = await createSolanaKeypair(pkp.tokenId);
    const connection = createSolanaConnection();

    const inputDecimals = await getTokenDecimals(connection, params.tokenIn);
    const atomicAmount = toAtomicAmount(params.amountIn, inputDecimals);

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
      response: {
        status: 'success',
        message: 'Swap transaction sent successfully',
        txid
      }
    });
  } catch (error: unknown) {
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor.name : 'UnknownError',
      ...(error instanceof Error && error.stack && { stack: error.stack })
    };

    Lit.Actions.setResponse({
      response: {
        status: 'error',
        error: 'Transaction failed',
        details: errorDetails
      }
    });
  }
})();