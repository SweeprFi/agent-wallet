import { z } from 'zod';
import {
  type AwTool,
  type SupportedLitNetwork,
  NETWORK_CONFIGS,
  NetworkConfig,
} from '@lit-protocol/aw-tool';

import { CctpUsdcPolicy, type CctpUsdcPolicyType } from './policy';
import { IPFS_CIDS } from './ipfs';

/**
 * Parameters required for the CctpUsdc Lit Action.
 * @property {string} pkpEthAddress - The Ethereum address of the PKP.
 * @property {string} rpcSrcUrl - RPC URL of the source chain
 * @property {string} rpcDstUrl - RPC URL of the destination chain
 * @property {string} srcChain - Source chain to transfer
 * @property {string} dstChain - Destination chain to transfer
 * @property {number} amount - Amount to be transfered
 * @property {string} burnTx - Burn transaction hash or empty string
 */
export interface CctpUsdcLitActionParameters {
  pkpEthAddress: string;
  rpcSrcUrl: string;
  rpcDstUrl: string;
  srcChain: string;
  dstChain: string;
  amount: string;
  burnTx: string;
}

/**
 * Zod schema for validating `CctpUsdcLitActionParameters`.
 */
const CctpUsdcLitActionSchema = z.object({
  pkpEthAddress: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      'Must be a valid Ethereum address (0x followed by 40 hexadecimal characters)'
    ),
  rpcSrcUrl: z
    .string()
    .url()
    .startsWith(
      'https://',
      'Must be a valid HTTPS URL for the blockchain RPC endpoint'
    ),
  rpcDstUrl: z
    .string()
    .url()
    .startsWith(
      'https://',
      'Must be a valid HTTPS URL for the blockchain RPC endpoint'
    ),
  srcChain: z
    .string()
    .regex(/^\d+$/, 'Must be a valid chain ID number as a string'),
  dstChain: z
    .string()
    .regex(/^\d+$/, 'Must be a valid chain ID number as a string'),
  amount: z
    .string()
    .regex(
      /^\d*\.?\d+$/,
      'Must be a valid decimal number as a string (e.g. "1.5" or "100")'
    ),
    burnTx: z.string(),
});

/**
 * Descriptions of each parameter for the CctpUsdc Lit Action.
 * These descriptions are designed to be consumed by LLMs (Language Learning Models) to understand the required parameters.
 */
const CctpUsdcLitActionParameterDescriptions = {
  pkpEthAddress:
    'The Ethereum address of the PKP that will be used to perform the action.',
  rpcSrcUrl: 'RPC URL of the source chain',
  rpcDstUrl: 'RPC URL of the destination chain',
  srcChain: 'Source chain to transfer',
  dstChain: 'Destination chain to transfer',
  amount: 'Amount to be transfer',
  burnTx: 'Burn transaction hash or empty string',
} as const;

/**
 * Validates the parameters for the CctpUsdc Lit Action.
 * @param params - The parameters to validate.
 * @returns `true` if the parameters are valid, or an array of errors if invalid.
 */
const validateCctpUsdcParameters = (
  params: unknown
): true | Array<{ param: string; error: string }> => {
  const result = CctpUsdcLitActionSchema.safeParse(params);
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
 * Creates a network-specific CctpUsdc tool.
 * @param network - The supported Lit network (e.g., `datil-dev`, `datil-test`, `datil`).
 * @param config - The network configuration.
 * @returns A configured `AwTool` instance for the CctpUsdc Lit Action.
 */
const createNetworkTool = (
  network: SupportedLitNetwork,
  config: NetworkConfig
): AwTool<CctpUsdcLitActionParameters, CctpUsdcPolicyType> => ({
  name: 'CctpUsdc',
  description: `A Lit Action for sending USDC cross-chain using CTTP`,
  ipfsCid: IPFS_CIDS[network].tool,
  defaultPolicyIpfsCid: IPFS_CIDS[network].defaultPolicy,
  chain: 'ethereum',
  parameters: {
    type: {} as CctpUsdcLitActionParameters,
    schema: CctpUsdcLitActionSchema,
    descriptions: CctpUsdcLitActionParameterDescriptions,
    validate: validateCctpUsdcParameters,
  },
  policy: CctpUsdcPolicy,
});

/**
 * Exports network-specific CctpUsdc tools.
 * Each tool is configured for a specific Lit network (e.g., `datil-dev`, `datil-test`, `datil`).
 */
export const CctpUsdc = Object.entries(NETWORK_CONFIGS).reduce(
  (acc, [network, config]) => ({
    ...acc,
    [network]: createNetworkTool(network as SupportedLitNetwork, config),
  }),
  {} as Record<
    SupportedLitNetwork,
    AwTool<CctpUsdcLitActionParameters, CctpUsdcPolicyType>
  >
);