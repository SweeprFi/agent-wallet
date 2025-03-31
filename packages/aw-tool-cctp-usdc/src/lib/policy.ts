import { z } from 'zod';
import { ethers } from 'ethers';

/**
 * Schema for validating a CctpUsdc policy.
 * Ensures the policy has the correct structure and valid values.
 */
const policySchema = z.object({
  /** The type of policy, must be `CctpUsdc`. */
  type: z.literal('CctpUsdc'),

  /** The version of the policy. */
  version: z.string(),

  /** Max amount to be transfer */
  maxAmount: z.number()
});

/**
 * Encodes a CctpUsdc policy into a format suitable for on-chain storage.
 * @param policy - The CctpUsdc policy to encode.
 * @returns The encoded policy as a hex string.
 * @throws If the policy does not conform to the schema.
 */
function encodePolicy(policy: CctpUsdcPolicyType): string {
  // Validate the policy against the schema
  policySchema.parse(policy);

  return ethers.utils.defaultAbiCoder.encode(
    ['tuple(number maxAmount)'],
    [policy]
  );
}

/**
 * Decodes a CctpUsdc policy from its on-chain encoded format.
 * @param encodedPolicy - The encoded policy as a hex string.
 * @returns The decoded CctpUsdc policy.
 * @throws If the encoded policy is invalid or does not conform to the schema.
 */
function decodePolicy(encodedPolicy: string): CctpUsdcPolicyType {
  const decoded = ethers.utils.defaultAbiCoder.decode(
    ['tuple(number maxAmount)'],
    encodedPolicy
  )[0];

  const policy: CctpUsdcPolicyType = {
    type: 'CctpUsdc',
    version: '1.0.0',
    maxAmount: decoded.maxAmount
  };

  return policySchema.parse(policy);
}

/**
 * Represents the type of a CctpUsdc policy, inferred from the schema.
 */
export type CctpUsdcPolicyType = z.infer<typeof policySchema>;

/**
 * Utility object for working with CctpUsdc policies.
 * Includes the schema, encoding, and decoding functions.
 */
export const CctpUsdcPolicy = {
  /** The type of the policy. */
  type: {} as CctpUsdcPolicyType,
  /** The version of the policy. */
  version: '1.0.0',
  /** The schema for validating CctpUsdc policies. */
  schema: policySchema,
  /** Encodes a CctpUsdc policy into a format suitable for on-chain storage. */
  encode: encodePolicy,
  /** Decodes a CctpUsdc policy from its on-chain encoded format. */
  decode: decodePolicy,
};