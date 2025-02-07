import { z } from 'zod';
import { PublicKey } from '@solana/web3.js';

/**
 * Schema for validating a JupiterSwap policy.
 * Ensures the policy has the correct structure and valid values.
 */
const policySchema = z.object({
  /** The type of policy, must be `JupiterSwap`. */
  type: z.literal('JupiterSwap'),

  /** The version of the policy. */
  version: z.string(),

  /** The maximum amount of token that can be sent. */
  maxAmount: z.number(),

  /** The swap can only be performed between these tokens. */
  allowedTokens: z.array(z.string().refine((val: string) => {
    try {
      new PublicKey(val);
      return true;
    } catch {
      return false;
    }
  }, "Invalid Solana token address"))
});

/**
 * Encodes a JupiterSwap policy into a format suitable for on-chain storage.
 * @param policy - The JupiterSwap policy to encode.
 * @returns The encoded policy as a hex string.
 * @throws If the policy does not conform to the schema.
 */
function encodePolicy(policy: JupiterSwapPolicyType): string {
  // Validate the policy against the schema
  policySchema.parse(policy);
  
  return Buffer.from(JSON.stringify({
    maxAmount: BigInt(policy.maxAmount).toString(),
    allowedTokens: policy.allowedTokens
  })).toString('base64');
}

/**
 * Decodes a JupiterSwap policy from its on-chain encoded format.
 * @param encodedPolicy - The encoded policy as a hex string.
 * @returns The decoded JupiterSwap policy.
 * @throws If the encoded policy is invalid or does not conform to the schema.
 */
function decodePolicy(encodedPolicy: string): JupiterSwapPolicyType {
  const decoded = JSON.parse(Buffer.from(encodedPolicy, 'base64').toString());
  
  const policy: JupiterSwapPolicyType = {
    type: 'JupiterSwap',
    version: '1.0.0',
    maxAmount: Number(BigInt(decoded.maxAmount)),
    allowedTokens: decoded.allowedTokens.map((addr: string) => new PublicKey(addr).toBase58())
  };

  return policySchema.parse(policy);
}

/**
 * Represents the type of a JupiterSwap policy, inferred from the schema.
 */
export type JupiterSwapPolicyType = z.infer<typeof policySchema>;

/**
 * Utility object for working with JupiterSwap policies.
 * Includes the schema, encoding, and decoding functions.
 */
export const JupiterSwapPolicy = {
  /** The type of the policy. */
  type: {} as JupiterSwapPolicyType,

  /** The version of the policy. */
  version: '1.0.0',

  /** The schema for validating JupiterSwap policies. */
  schema: policySchema,

  /** Encodes a JupiterSwap policy into a format suitable for on-chain storage. */
  encode: encodePolicy,

  /** Decodes a JupiterSwap policy from its on-chain encoded format. */
  decode: decodePolicy,
};