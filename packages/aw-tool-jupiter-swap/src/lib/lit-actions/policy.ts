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

function hexToBytes(hex: string): Uint8Array {
  // Remove '0x' prefix if present
  hex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function cleanDecodedString(str: string): string {
  // Remove null bytes and trim whitespace
  return str.replace(/\0/g, '').trim();
}

function validateToken(token: string, allowedTokens: string[], tokenType: string): string {
  try {
    const tokenPubkey = new PublicKey(token).toBase58();
    if (!allowedTokens.includes(tokenPubkey)) {
      throw new Error(
        `${tokenType} token ${token} not allowed. Must be one of: ${allowedTokens.join(', ')}`
      );
    }
    return tokenPubkey;
  } catch (error) {
    throw new Error(`Invalid Solana token address for ${tokenType}: ${token}`);
  }
}

function toAtomicAmount(amount: string, decimals: number = 9): string {
  // Convert decimal string to atomic units
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0');
  const atomicAmount = `${whole}${paddedFraction}`;
  // Remove leading zeros
  return atomicAmount.replace(/^0+/, '') || '0';
}

(async () => {
  try {
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

    const decoder = new TextDecoder();
    for (const parameter of policyParameters) {
      if (parameter.value === undefined) {
        console.log(`Parameter ${parameter.name} has undefined value`);
        continue;
      }

      try {
        const bytes = hexToBytes(parameter.value);
        const value = cleanDecodedString(decoder.decode(bytes));
        console.log(`Decoded ${parameter.name}: ${value}`);

        switch (parameter.name) {
          case 'maxAmount':
            maxAmount = BigInt(value);
            console.log(`Formatted maxAmount: ${maxAmount.toString()}`);
            break;
          case 'allowedTokens':
            try {
              allowedTokens = JSON.parse(value);
              console.log(`Parsed allowedTokens: ${JSON.stringify(allowedTokens)}`);
              allowedTokens = allowedTokens.map((addr: string) => {
                try {
                  return new PublicKey(addr).toBase58();
                } catch (error) {
                  throw new Error(`Invalid token address in policy: ${addr}`);
                }
              });
              console.log(`Normalized allowedTokens: ${allowedTokens.join(', ')}`);
            } catch (error) {
              throw new Error(`Invalid allowedTokens format: ${error instanceof Error ? error.message : String(error)}`);
            }
            break;
        }
      } catch (error) {
        throw new Error(`Failed to decode parameter ${parameter.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const atomicAmount = toAtomicAmount(toolParameters.amountIn);
    console.log(`Converting amount ${toolParameters.amountIn} to atomic units: ${atomicAmount}`);
    const amountBigInt = BigInt(atomicAmount);

    if (maxAmount !== BigInt(0)) {
      console.log(
        `Checking if amount ${amountBigInt.toString()} exceeds maxAmount ${maxAmount.toString()}...`
      );

      if (amountBigInt > maxAmount) {
        throw new Error(
          `Amount ${toolParameters.amountIn} exceeds the maximum amount ${maxAmount.toString()}`
        );
      }
    }

    if (allowedTokens.length > 0) {
      console.log('Validating input and output tokens against allowed list...');
      validateToken(toolParameters.tokenIn, allowedTokens, 'input');
      validateToken(toolParameters.tokenOut, allowedTokens, 'output');
    }

    console.log('Policy parameters validated');
  } catch (error) {
    throw new Error(`Policy validation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
})();
