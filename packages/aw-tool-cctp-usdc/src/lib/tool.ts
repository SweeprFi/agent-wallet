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
 * @property {string} action - Action to be executed (send - receive: in this case must include burnTx)
 * @property {string} opChainId - Chain ID of the destination chain to transfer to OR the chain ID of the source chain to transfer from
 * @property {number} amount - Amount to be transfered
 * @property {string} burnTx - Burn transaction hash or empty string
 * @property {string} rpcUrl - RPC URL of the source chain
 */
export interface CctpUsdcLitActionParameters {
  pkpEthAddress: string;
  action: string;
  opChainId: string;
  amount: string;
  burnTx: string;
  rpcUrl: string;
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
  action: z
    .string()
    .regex(/^(send|receive)$/, 'Must be either "send" or "receive"'),
  opChainId: z
    .string()
    .regex(/^\d+$/, 'Must be a valid chain ID number as a string'),
  amount: z
    .string()
    .regex(
      /^\d*\.?\d+$/,
      'Must be a valid decimal number as a string (e.g. "1.5" or "100")'
    ),
  burnTx: z
    .string()
    .regex(
      /^(0x[a-fA-F0-9]{64}|)$/,
      'Must be a valid Ethereum transaction hash (0x followed by 64 hexadecimal characters) or empty string'
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
 * Descriptions of each parameter for the CctpUsdc Lit Action.
 * These descriptions are designed to be consumed by LLMs (Language Learning Models) to understand the required parameters.
 */
const CctpUsdcLitActionParameterDescriptions = {
  pkpEthAddress: 'The Ethereum address of the PKP that will be used to perform the action.',
  action: 'Action to be executed (send - receive: in this case must include burnTx)',
  opChainId:
    'Chain ID of the destination chain to transfer to OR the chain ID of the source chain to transfer from. This depends on the action (send: destination chain id - receive: source chain id).',
  amount: 'Amount to be transfer',
  burnTx: 'Burn transaction hash or empty string',
  rpcUrl: 'The RPC URL of the blockchain network to connect to (e.g. "https://base-sepolia-rpc.publicnode.com").',
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