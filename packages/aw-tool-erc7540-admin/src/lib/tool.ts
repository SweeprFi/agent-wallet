import { z } from 'zod';
import {
  type AwTool,
  type SupportedLitNetwork,
  NETWORK_CONFIGS,
  NetworkConfig,
} from '@lit-protocol/aw-tool';

import { Erc7540AdminPolicy, type Erc7540AdminPolicyType } from './policy';
import { IPFS_CIDS } from './ipfs';

/**
 * Parameters required for the Erc7540Admin Lit Action.
 * @property {string} pkpEthAddress - The Ethereum address of the PKP.
 * @property {string} controller - A user wallet of the system
 * @property {number} amount - Amount of assets or shares to be processed
 */
export interface Erc7540AdminLitActionParameters {
  pkpEthAddress: string;
  controller: string;
  amount: string;
  action: string;
  vault: string;
  rpcUrl: string;
}

/**
 * Zod schema for validating `Erc7540AdminLitActionParameters`.
 */
const Erc7540AdminLitActionSchema = z.object({
  pkpEthAddress: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      'Must be a valid Ethereum address (0x followed by 40 hexadecimal characters)'
    ),
  controller: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      'Must be a valid Ethereum address (0x followed by 40 hexadecimal characters)'
    ),
  amount: z
    .string()
    .regex(
      /^\d*\.?\d+$/,
      'Must be a valid decimal number as a string (e.g. "1.5" or "100")'
    ),
  action: z
    .string()
    .regex(
      /^(fulfillDeposit|fulfillRedeem|takeAssets|returnAssets|updateInvested|getValues)$/,
      'Must be one of the following values: fulfillDeposit, fulfillRedeem, takeAssets, returnAssets, updateInvested'
    ),
  vault: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      'Must be a valid Ethereum address (0x followed by 40 hexadecimal characters)'
    ),
  rpcUrl: z
    .string()
    .url()
    .startsWith(
      'https://',
      'Must be a valid HTTPS URL for the blockchain RPC endpoint'
    ),
});

/**
 * Descriptions of each parameter for the Erc7540Admin Lit Action.
 * These descriptions are designed to be consumed by LLMs (Language Learning Models) to understand the required parameters.
 */
const Erc7540AdminLitActionParameterDescriptions = {
  pkpEthAddress:
    'The Ethereum address of the PKP that will be used to perform the action.',
  controller: 'A user wallet of the system',
  amount: 'Amount of assets or shares to be processed',
  action: 'The action to perform: fulfillDeposit | fulfillRedeem | takeAssets | returnAssets | updateInvested | getValues',
  vault: 'The vault address',
  rpcUrl: 'The RPC URL for the blockchain network',
} as const;

/**
 * Validates the parameters for the Erc7540Admin Lit Action.
 * @param params - The parameters to validate.
 * @returns `true` if the parameters are valid, or an array of errors if invalid.
 */
const validateErc7540AdminParameters = (
  params: unknown
): true | Array<{ param: string; error: string }> => {
  const result = Erc7540AdminLitActionSchema.safeParse(params);
  if (result.success) {
    return true;
  }

  // Map validation errors to a more user-friendly format
  return result.error.issues.map((issue:any) => ({
    param: issue.path[0] as string,
    error: issue.message,
  }));
};

/**
 * Creates a network-specific Erc7540Admin tool.
 * @param network - The supported Lit network (e.g., `datil-dev`, `datil-test`, `datil`).
 * @param config - The network configuration.
 * @returns A configured `AwTool` instance for the Erc7540Admin Lit Action.
 */
const createNetworkTool = (
  network: SupportedLitNetwork,
  config: NetworkConfig
): AwTool<Erc7540AdminLitActionParameters, Erc7540AdminPolicyType> => ({
  name: 'Erc7540Admin',
  description: `Erc7540Admin Tool`,
  ipfsCid: IPFS_CIDS[network].tool,
  defaultPolicyIpfsCid: IPFS_CIDS[network].defaultPolicy,
  chain: 'ethereum',
  parameters: {
    type: {} as Erc7540AdminLitActionParameters,
    schema: Erc7540AdminLitActionSchema,
    descriptions: Erc7540AdminLitActionParameterDescriptions,
    validate: validateErc7540AdminParameters,
  },
  policy: Erc7540AdminPolicy,
});

/**
 * Exports network-specific Erc7540Admin tools.
 * Each tool is configured for a specific Lit network (e.g., `datil-dev`, `datil-test`, `datil`).
 */
export const Erc7540Admin = Object.entries(NETWORK_CONFIGS).reduce(
  (acc, [network, config]) => ({
    ...acc,
    [network]: createNetworkTool(network as SupportedLitNetwork, config),
  }),
  {} as Record<
    SupportedLitNetwork,
    AwTool<Erc7540AdminLitActionParameters, Erc7540AdminPolicyType>
  >
);