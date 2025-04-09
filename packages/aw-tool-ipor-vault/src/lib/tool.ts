import { z } from 'zod';
import {
  type AwTool,
  type SupportedLitNetwork,
  NETWORK_CONFIGS,
  NetworkConfig,
} from '@lit-protocol/aw-tool';

import { IporVaultPolicy, type IporVaultPolicyType } from './policy';
import { IPFS_CIDS } from './ipfs';

/**
 * Parameters required for the IporVault Lit Action.
 * @property {string} pkpEthAddress - The Ethereum address of the PKP.
 * @property {string} action - Action to be executed (deposit - redeem - value)
 * @property {string} amount - Amount to deposit or redeem
 * @property {string} vault - IPOR vault address
 */
export interface IporVaultLitActionParameters {
  pkpEthAddress: string;
  action: string;
  amount: string;
  vault: string;
  rpcUrl: string;
}

/**
 * Zod schema for validating `IporVaultLitActionParameters`.
 */
const IporVaultLitActionSchema = z.object({
  pkpEthAddress: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      'Must be a valid Ethereum address (0x followed by 40 hexadecimal characters)'
    ),
  action: z
    .string()
    .regex(
      /^(deposit|redeem|value)$/,
      'Must be one of the following values: deposit, redeem, value'
    ),
  amount: z
    .string()
    .regex(
      /^\d*\.?\d+$/,
      'Must be a valid decimal number as a string (e.g. "1.5" or "100")'
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
 * Descriptions of each parameter for the IporVault Lit Action.
 * These descriptions are designed to be consumed by LLMs (Language Learning Models) to understand the required parameters.
 */
const IporVaultLitActionParameterDescriptions = {
  pkpEthAddress: 'The Ethereum address of the PKP that will be used to perform the action.',
  action: 'Action to be executed (deposit - redeem - value)',
  amount: 'Amount to deposit or redeem',
  vault: 'IPOR vault address',
  rpcUrl: 'The RPC URL of the blockchain network',
} as const;

/**
 * Validates the parameters for the IporVault Lit Action.
 * @param params - The parameters to validate.
 * @returns `true` if the parameters are valid, or an array of errors if invalid.
 */
const validateIporVaultParameters = (
  params: unknown
): true | Array<{ param: string; error: string }> => {
  const result = IporVaultLitActionSchema.safeParse(params);
  if (result.success) {
    return true;
  }

  // Map validation errors to a more user-friendly format
  return result.error.issues.map((issue: any) => ({
    param: issue.path[0] as string,
    error: issue.message,
  }));
};

/**
 * Creates a network-specific IporVault tool.
 * @param network - The supported Lit network (e.g., `datil-dev`, `datil-test`, `datil`).
 * @param config - The network configuration.
 * @returns A configured `AwTool` instance for the IporVault Lit Action.
 */
const createNetworkTool = (
  network: SupportedLitNetwork,
  config: NetworkConfig
): AwTool<IporVaultLitActionParameters, IporVaultPolicyType> => ({
  name: 'IporVault',
  description: `IporVault Tool`,
  ipfsCid: IPFS_CIDS[network].tool,
  defaultPolicyIpfsCid: IPFS_CIDS[network].defaultPolicy,
  chain: 'ethereum',
  parameters: {
    type: {} as IporVaultLitActionParameters,
    schema: IporVaultLitActionSchema,
    descriptions: IporVaultLitActionParameterDescriptions,
    validate: validateIporVaultParameters,
  },
  policy: IporVaultPolicy,
});

/**
 * Exports network-specific IporVault tools.
 * Each tool is configured for a specific Lit network (e.g., `datil-dev`, `datil-test`, `datil`).
 */
export const IporVault = Object.entries(NETWORK_CONFIGS).reduce(
  (acc, [network, config]) => ({
    ...acc,
    [network]: createNetworkTool(network as SupportedLitNetwork, config),
  }),
  {} as Record<
    SupportedLitNetwork,
    AwTool<IporVaultLitActionParameters, IporVaultPolicyType>
  >
);