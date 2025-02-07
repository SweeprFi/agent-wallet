import {
  checkLitAuthAddressIsDelegatee,
  getPkpToolRegistryContract,
  getPolicyParameters,
} from '@lit-protocol/aw-tool';

import { PublicKey } from "@solana/web3.js";

declare global {
  // Required Inputs
  const parentToolIpfsCid: string;
  const pkpToolRegistryContractAddress: string;
  const pkpTokenId: string;
  const delegateeAddress: string;
  const toolParameters: {
    amountIn: string;
    tokenIn: string;
    tokenOut: string;
  };
}

(async () => {
  const pkpToolRegistryContract = await getPkpToolRegistryContract(
    pkpToolRegistryContractAddress
  );

  const isDelegatee = await checkLitAuthAddressIsDelegatee(
    pkpToolRegistryContract,
    pkpTokenId
  );
  if (!isDelegatee) {
    throw new Error(
      `Session signer ${LitAuth.authSigAddress} is not a delegatee for PKP ${pkpTokenId}`
    );
  }

  const policyParameters = await getPolicyParameters(
    pkpToolRegistryContract,
    pkpTokenId,
    parentToolIpfsCid,
    delegateeAddress,
    ['maxAmount', 'allowedTokens']
  );

  let maxAmount = BigInt(0);
  let allowedTokens: string[] = [];

  console.log(
    `Retrieved policy parameters: ${JSON.stringify(policyParameters)}`
  );

  for (const parameter of policyParameters) {
    const value = new TextDecoder().decode(parameter.value);

    switch (parameter.name) {
      case 'maxAmount':
        maxAmount = BigInt(value);
        console.log(`Formatted maxAmount: ${maxAmount.toString()}`);
        break;
      case 'allowedTokens':
        allowedTokens = JSON.parse(value);
        allowedTokens = allowedTokens.map((addr: string) => new PublicKey(addr).toBase58());
        console.log(`Formatted allowedTokens: ${allowedTokens.join(', ')}`);
        break;
    }
  }

  if (maxAmount === BigInt(0)) {
    throw new Error('maxAmount policy parameter is required but was not found');
  }

  // Convert string amount to BigInt and compare
  const amountBigInt = BigInt(toolParameters.amountIn);
  console.log(
    `Checking if amount ${amountBigInt.toString()} exceeds maxAmount ${maxAmount.toString()}...`
  );

  if (amountBigInt > maxAmount) {
    throw new Error(
      `Amount ${amountBigInt.toString()} exceeds the maximum amount ${maxAmount.toString()}`
    );
  }

  if (allowedTokens.length > 0) {
    console.log(`Checking if ${toolParameters.tokenIn} is an allowed token...`);
    try {
      const tokenInPubkey = new PublicKey(toolParameters.tokenIn).toBase58();
      if (!allowedTokens.includes(tokenInPubkey)) {
        throw new Error(
          `Token ${toolParameters.tokenIn} not allowed. Allowed tokens: ${allowedTokens.join(', ')}`
        );
      }
    } catch (e) {
      throw new Error(`Invalid Solana token address for tokenIn: ${toolParameters.tokenIn}`);
    }

    console.log(`Checking if ${toolParameters.tokenOut} is an allowed token...`);
    try {
      const tokenOutPubkey = new PublicKey(toolParameters.tokenOut).toBase58();
      if (!allowedTokens.includes(tokenOutPubkey)) {
        throw new Error(
          `Token ${toolParameters.tokenOut} not allowed. Allowed tokens: ${allowedTokens.join(', ')}`
        );
      }
    } catch (e) {
      throw new Error(`Invalid Solana token address for tokenOut: ${toolParameters.tokenOut}`);
    }
  }

  console.log('Policy parameters validated');
})();
