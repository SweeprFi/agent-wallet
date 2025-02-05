import { type AwTool } from '@lit-protocol/agent-wallet';
import prompts from 'prompts';
import { LawCliError, DelegateeErrors, LocalStorage } from '../../core';
import { promptSelectChain } from './get-chain-details';

/**
 * Prompts the user for tool parameters.
 * @param localStorage - The local storage instance.
 * @param tool - The tool to get parameters for.
 * @param pkpEthAddress - The PKP's Ethereum address.
 * @param options - Optional parameters for controlling the prompts.
 * @returns A promise that resolves to an object containing the tool parameters.
 */
export const getToolParams = async <T extends Record<string, any>>(
  localStorage: LocalStorage,
  tool: AwTool<T, any>,
  pkpEthAddress: string,
  options?: {
    missingParams?: Array<keyof T>;
    foundParams?: Partial<T>;
  }
): Promise<T> => {
  const params: Record<string, any> = { ...options?.foundParams };

  const paramsToPrompt = options?.missingParams
    ? Object.entries(tool.parameters.descriptions).filter(([paramName]) =>
        options.missingParams?.includes(paramName as keyof T)
      )
    : Object.entries(tool.parameters.descriptions);

  // First check if we need both chain parameters
  const needsChainId = paramsToPrompt.some(
    ([paramName]) => paramName === 'chainId'
  );
  const needsRpcUrl = paramsToPrompt.some(
    ([paramName]) => paramName === 'rpcUrl'
  );

  // If we need either chain parameter, handle them together
  if (needsChainId || needsRpcUrl) {
    const chainParams = await promptSelectChain(localStorage, {
      needsChainId,
      needsRpcUrl,
    });

    if (chainParams.chainId) params.chainId = chainParams.chainId;
    if (chainParams.rpcUrl) params.rpcUrl = chainParams.rpcUrl;

    // Filter out the chain parameters as we've handled them
    paramsToPrompt.splice(
      0,
      paramsToPrompt.length,
      ...paramsToPrompt.filter(
        ([paramName]) => paramName !== 'chainId' && paramName !== 'rpcUrl'
      )
    );
  }

  // Handle remaining parameters
  for (const [paramName, description] of paramsToPrompt) {
    // Skip pkpEthAddress, ciphertext, and dataToEncryptHash as they're handled elsewhere
    if (paramName === 'pkpEthAddress' || 
        paramName === 'ciphertext' || 
        paramName === 'dataToEncryptHash') {
      continue;
    }

    // If we already have this parameter in foundParams, skip it
    if (options?.foundParams && paramName in options.foundParams) {
      continue;
    }

    const { value } = await prompts({
      type: 'text',
      name: 'value',
      message: `Enter ${paramName} (${description}):`,
    });

    if (value === undefined) {
      throw new LawCliError(
        DelegateeErrors.TOOL_PARAMS_CANCELLED,
        'Parameter input was cancelled'
      );
    }

    params[paramName] = value;
  }

  // Set pkpEthAddress if not already set
  if (!params.pkpEthAddress) {
    params.pkpEthAddress = pkpEthAddress;
  }

  const validationResult = tool.parameters.validate(params);
  if (validationResult !== true) {
    const errors = validationResult
      .map(({ param, error }) => `${param}: ${error}`)
      .join('\n');
    throw new LawCliError(
      DelegateeErrors.TOOL_PARAMS_INVALID,
      `Invalid parameters:\n${errors}`
    );
  }

  return params as T;
};
