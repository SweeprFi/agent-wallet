import { z } from 'zod';
import {
  type AwTool,
  type SupportedLitNetwork,
  NETWORK_CONFIGS,
  NetworkConfig,
} from '@lit-protocol/aw-tool';

import { SignEddsaPolicy, type SignEddsaPolicyType } from './policy';
import { IPFS_CIDS } from './ipfs';

/**
 * Parameters required for the SignEddsa Lit Action.
 * @property {string} pkpEthAddress - The Ethereum address of the PKP.
 * @property {string} message - The message you want to sign.
 * @property {string} ciphertext - The encrypted key data.
 * @property {string} dataToEncryptHash - The hash of the data that was encrypted.
 */
export interface SignEddsaLitActionParameters {
  pkpEthAddress: string;
  message: string;
  ciphertext: string;
  dataToEncryptHash: string;
}

/**
 * Zod schema for validating `SignEddsaLitActionParameters`.
 */
const SignEddsaLitActionSchema = z.object({
  pkpEthAddress: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      'Must be a valid Ethereum address (0x followed by 40 hexadecimal characters)'
    ),
  message: z.string(),
  ciphertext: z.string(),
  dataToEncryptHash: z.string(),
});

/**
 * Descriptions of each parameter for the SignEddsa Lit Action.
 * These descriptions are designed to be consumed by LLMs (Language Learning Models) to understand the required parameters.
 */
const SignEddsaLitActionParameterDescriptions = {
  pkpEthAddress:
    'The Ethereum address of the PKP that will be used to perform the action.',
  message: 'The message you want to sign.',
  ciphertext: 'The encrypted key data.',
  dataToEncryptHash: 'The hash of the data that was encrypted.',
} as const;

/**
 * Validates the parameters for the SignEddsa Lit Action.
 * @param params - The parameters to validate.
 * @returns `true` if the parameters are valid, or an array of errors if invalid.
 */
const validateSignEddsaParameters = (
  params: unknown
): true | Array<{ param: string; error: string }> => {
  const result = SignEddsaLitActionSchema.safeParse(params);
  if (result.success) {
    return true;
  }

  // Map validation errors to a more user-friendly format
  return result.error.issues.map((issue) => ({
    param: issue.path[0] as string,
    error: issue.message,
  }));
};

/**
 * Creates a network-specific SignEddsa tool.
 * @param network - The supported Lit network (e.g., `datil-dev`, `datil-test`, `datil`).
 * @param config - The network configuration.
 * @returns A configured `AwTool` instance for the SignEddsa Lit Action.
 */
const createNetworkTool = (
  network: SupportedLitNetwork,
  config: NetworkConfig
): AwTool<SignEddsaLitActionParameters, SignEddsaPolicyType> => ({
  name: 'SignEddsa',
  description: `SignEddsa Tool`,
  ipfsCid: IPFS_CIDS[network].tool,
  defaultPolicyIpfsCid: IPFS_CIDS[network].defaultPolicy,
  chain: 'solana',
  parameters: {
    type: {} as SignEddsaLitActionParameters,
    schema: SignEddsaLitActionSchema,
    descriptions: SignEddsaLitActionParameterDescriptions,
    validate: validateSignEddsaParameters,
  },
  policy: SignEddsaPolicy,
});

/**
 * Exports network-specific SignEddsa tools.
 * Each tool is configured for a specific Lit network (e.g., `datil-dev`, `datil-test`, `datil`).
 */
export const SignEddsa = Object.entries(NETWORK_CONFIGS).reduce(
  (acc, [network, config]) => ({
    ...acc,
    [network]: createNetworkTool(network as SupportedLitNetwork, config),
  }),
  {} as Record<
    SupportedLitNetwork,
    AwTool<SignEddsaLitActionParameters, SignEddsaPolicyType>
  >
);