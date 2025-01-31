import { z } from 'zod';
import {
  type AwTool,
  type SupportedLitNetwork,
  NETWORK_CONFIGS,
  NetworkConfig,
} from '@lit-protocol/aw-tool';

import { EnsoPolicy, type EnsoPolicyType } from './policy';
import { IPFS_CIDS } from './ipfs';

/**
 * Parameters required for the Enso Lit Action.
 * @property {string} pkpEthAddress - The Ethereum address of the PKP.
 
 */
export interface EnsoLitActionParameters {
  pkpEthAddress: string;
  ;
}

/**
 * Zod schema for validating `EnsoLitActionParameters`.
 */
const EnsoLitActionSchema = z.object({
  pkpEthAddress: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      'Must be a valid Ethereum address (0x followed by 40 hexadecimal characters)'
    ),
  
});

/**
 * Descriptions of each parameter for the Enso Lit Action.
 * These descriptions are designed to be consumed by LLMs (Language Learning Models) to understand the required parameters.
 */
const EnsoLitActionParameterDescriptions = {
  pkpEthAddress:
    'The Ethereum address of the PKP that will be used to perform the action.',
  
} as const;

/**
 * Validates the parameters for the Enso Lit Action.
 * @param params - The parameters to validate.
 * @returns `true` if the parameters are valid, or an array of errors if invalid.
 */
const validateEnsoParameters = (
  params: unknown
): true | Array<{ param: string; error: string }> => {
  const result = EnsoLitActionSchema.safeParse(params);
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
 * Creates a network-specific Enso tool.
 * @param network - The supported Lit network (e.g., `datil-dev`, `datil-test`, `datil`).
 * @param config - The network configuration.
 * @returns A configured `AwTool` instance for the Enso Lit Action.
 */
const createNetworkTool = (
  network: SupportedLitNetwork,
  config: NetworkConfig
): AwTool<EnsoLitActionParameters, EnsoPolicyType> => ({
  name: 'Enso',
  description: `Enso Tool`,
  ipfsCid: IPFS_CIDS[network].tool,
  defaultPolicyIpfsCid: IPFS_CIDS[network].defaultPolicy,
  parameters: {
    type: {} as EnsoLitActionParameters,
    schema: EnsoLitActionSchema,
    descriptions: EnsoLitActionParameterDescriptions,
    validate: validateEnsoParameters,
  },
  policy: EnsoPolicy,
});

/**
 * Exports network-specific Enso tools.
 * Each tool is configured for a specific Lit network (e.g., `datil-dev`, `datil-test`, `datil`).
 */
export const Enso = Object.entries(NETWORK_CONFIGS).reduce(
  (acc, [network, config]) => ({
    ...acc,
    [network]: createNetworkTool(network as SupportedLitNetwork, config),
  }),
  {} as Record<
    SupportedLitNetwork,
    AwTool<EnsoLitActionParameters, EnsoPolicyType>
  >
);