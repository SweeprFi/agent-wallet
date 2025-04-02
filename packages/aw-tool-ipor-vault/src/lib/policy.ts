import { z } from 'zod';
import { ethers } from 'ethers';

/**
 * Schema for validating a IporVault policy.
 * Ensures the policy has the correct structure and valid values.
 */
const policySchema = z.object({
  /** The type of policy, must be `IporVault`. */
  type: z.literal('IporVault'),

  /** The version of the policy. */
  version: z.string(),

  /** Permitted vaults */
  allowedVaults: z.array(z.string()),

  /** Max amount used by the agent */
  maxAmount: z.string()
});

/**
 * Encodes a IporVault policy into a format suitable for on-chain storage.
 * @param policy - The IporVault policy to encode.
 * @returns The encoded policy as a hex string.
 * @throws If the policy does not conform to the schema.
 */
function encodePolicy(policy: IporVaultPolicyType): string {
  // Validate the policy against the schema
  policySchema.parse(policy);

  return ethers.utils.defaultAbiCoder.encode(
    ['tuple(string[] allowedVaults, string maxAmount)'],
    [policy]
  );
}

/**
 * Decodes a IporVault policy from its on-chain encoded format.
 * @param encodedPolicy - The encoded policy as a hex string.
 * @returns The decoded IporVault policy.
 * @throws If the encoded policy is invalid or does not conform to the schema.
 */
function decodePolicy(encodedPolicy: string): IporVaultPolicyType {
  const decoded = ethers.utils.defaultAbiCoder.decode(
    ['tuple(string[] allowedVaults, string maxAmount)'],
    encodedPolicy
  )[0];

  const policy: IporVaultPolicyType = {
    type: 'IporVault',
    version: '1.0.0',
    allowedVaults: decoded.allowedVaults,
    maxAmount: decoded.maxAmount
  };

  return policySchema.parse(policy);
}

/**
 * Represents the type of a IporVault policy, inferred from the schema.
 */
export type IporVaultPolicyType = z.infer<typeof policySchema>;

/**
 * Utility object for working with IporVault policies.
 * Includes the schema, encoding, and decoding functions.
 */
export const IporVaultPolicy = {
  /** The type of the policy. */
  type: {} as IporVaultPolicyType,

  /** The version of the policy. */
  version: '1.0.0',

  /** The schema for validating IporVault policies. */
  schema: policySchema,

  /** Encodes a IporVault policy into a format suitable for on-chain storage. */
  encode: encodePolicy,

  /** Decodes a IporVault policy from its on-chain encoded format. */
  decode: decodePolicy,
};