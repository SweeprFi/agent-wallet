import { z } from 'zod';
import {
  type AwTool,
  type SupportedLitNetwork,
  NETWORK_CONFIGS,
  NetworkConfig,
} from '@lit-protocol/aw-tool';

import { JupiterSwapPolicy, type JupiterSwapPolicyType } from './policy';
import { IPFS_CIDS } from './ipfs';

/**
 * Parameters required for the JupiterSwap Lit Action.
 * @property {string} pkpEthAddress - The Ethereum address of the PKP.
 * @property {string} tokenIn - The Solana contract address of the SPL token you want to send. Must be a valid SPL address.
 * @property {string} tokenOut - The Solana contract address of the SPL token you want to receive. Must be a valid SPL address.
 * @property {string} amountIn - The amount of tokens to send, specified as a string. This should be a decimal number (e.g. "1.5" or "100"). The amount will be automatically adjusted based on the token\'s decimals.
 */
export interface JupiterSwapLitActionParameters {
  pkpEthAddress: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
}

/**
 * Zod schema for validating `JupiterSwapLitActionParameters`.
 */
const JupiterSwapLitActionSchema = z.object({
  pkpEthAddress: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      'Must be a valid Ethereum address (0x followed by 40 hexadecimal characters)'
    ),
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string(),
});

/**
 * Descriptions of each parameter for the JupiterSwap Lit Action.
 * These descriptions are designed to be consumed by LLMs (Language Learning Models) to understand the required parameters.
 */
const JupiterSwapLitActionParameterDescriptions = {
  pkpEthAddress:
    'The Ethereum address of the PKP that will be used to perform the action.',
  tokenIn: 'The Solana contract address of the SPL token you want to send. Must be a valid SPL address.',
  tokenOut: 'The Solana contract address of the SPL token you want to receive. Must be a valid SPL address.',
  amountIn: 'The amount of tokens to send, specified as a string. This should be a decimal number (e.g. "1.5" or "100"). The amount will be automatically adjusted based on the token\'s decimals.',
} as const;

/**
 * Validates the parameters for the JupiterSwap Lit Action.
 * @param params - The parameters to validate.
 * @returns `true` if the parameters are valid, or an array of errors if invalid.
 */
const validateJupiterSwapParameters = (
  params: unknown
): true | Array<{ param: string; error: string }> => {
  const result = JupiterSwapLitActionSchema.safeParse(params);
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
 * Creates a network-specific JupiterSwap tool.
 * @param network - The supported Lit network (e.g., `datil-dev`, `datil-test`, `datil`).
 * @param config - The network configuration.
 * @returns A configured `AwTool` instance for the JupiterSwap Lit Action.
 */
const createNetworkTool = (
  network: SupportedLitNetwork,
  config: NetworkConfig
): AwTool<JupiterSwapLitActionParameters, JupiterSwapPolicyType> => ({
  name: 'JupiterSwap',
  description: `JupiterSwap Tool`,
  ipfsCid: IPFS_CIDS[network].tool,
  defaultPolicyIpfsCid: IPFS_CIDS[network].defaultPolicy,
  chain: 'solana',
  parameters: {
    type: {} as JupiterSwapLitActionParameters,
    schema: JupiterSwapLitActionSchema,
    descriptions: JupiterSwapLitActionParameterDescriptions,
    validate: validateJupiterSwapParameters,
  },
  policy: JupiterSwapPolicy,
});

/**
 * Exports network-specific JupiterSwap tools.
 * Each tool is configured for a specific Lit network (e.g., `datil-dev`, `datil-test`, `datil`).
 */
export const JupiterSwap = Object.entries(NETWORK_CONFIGS).reduce(
  (acc, [network, config]) => ({
    ...acc,
    [network]: createNetworkTool(network as SupportedLitNetwork, config),
  }),
  {} as Record<
    SupportedLitNetwork,
    AwTool<JupiterSwapLitActionParameters, JupiterSwapPolicyType>
  >
);