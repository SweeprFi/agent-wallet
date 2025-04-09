import { z } from 'zod';
import { ethers } from 'ethers';

/**
 * Schema for validating a Erc7540Admin policy.
 * Ensures the policy has the correct structure and valid values.
 */
const policySchema = z.object({
  /** The type of policy, must be `Erc7540Admin`. */
  type: z.literal('Erc7540Admin'),

  /** The version of the policy. */
  version: z.string(),

  
});

/**
 * Encodes a Erc7540Admin policy into a format suitable for on-chain storage.
 * @param policy - The Erc7540Admin policy to encode.
 * @returns The encoded policy as a hex string.
 * @throws If the policy does not conform to the schema.
 */
function encodePolicy(policy: Erc7540AdminPolicyType): string {
  // Validate the policy against the schema
  policySchema.parse(policy);

  return ethers.utils.defaultAbiCoder.encode(
    ['tuple()'],
    [policy]
  );
}

/**
 * Decodes a Erc7540Admin policy from its on-chain encoded format.
 * @param encodedPolicy - The encoded policy as a hex string.
 * @returns The decoded Erc7540Admin policy.
 * @throws If the encoded policy is invalid or does not conform to the schema.
 */
function decodePolicy(encodedPolicy: string): Erc7540AdminPolicyType {
  const decoded = ethers.utils.defaultAbiCoder.decode(
    ['tuple()'],
    encodedPolicy
  )[0];

  const policy: Erc7540AdminPolicyType = {
    type: 'Erc7540Admin',
    version: '1.0.0',
    
  };

  return policySchema.parse(policy);
}

/**
 * Represents the type of a Erc7540Admin policy, inferred from the schema.
 */
export type Erc7540AdminPolicyType = z.infer<typeof policySchema>;

/**
 * Utility object for working with Erc7540Admin policies.
 * Includes the schema, encoding, and decoding functions.
 */
export const Erc7540AdminPolicy = {
  /** The type of the policy. */
  type: {} as Erc7540AdminPolicyType,

  /** The version of the policy. */
  version: '1.0.0',

  /** The schema for validating Erc7540Admin policies. */
  schema: policySchema,

  /** Encodes a Erc7540Admin policy into a format suitable for on-chain storage. */
  encode: encodePolicy,

  /** Decodes a Erc7540Admin policy from its on-chain encoded format. */
  decode: decodePolicy,
};