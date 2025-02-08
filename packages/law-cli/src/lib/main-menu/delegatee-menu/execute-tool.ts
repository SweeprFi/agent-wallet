import { type DelegatedPkpInfo, type AwTool } from '@lit-protocol/agent-wallet';
import prompts from 'prompts';

import { Delegatee } from './delegatee';
import { LawCliError, logger, LocalStorage } from '../../core';
import { DelegateeErrors } from '../../core/law-cli-error';
import { getToolParams } from './get-tool-params';

/**
 * Prompts the user to select a tool from a list of available tools.
 */
const promptSelectTool = async (
  toolsWithPolicies: AwTool<any, any>[],
  toolsWithoutPolicies: AwTool<any, any>[]
) => {
  const choices = [
    ...toolsWithPolicies.map((tool) => ({
      title: `${tool.name} (with policy)`,
      description: `IPFS CID: ${tool.ipfsCid}`,
      value: tool,
    })),
    ...toolsWithoutPolicies.map((tool) => ({
      title: tool.name,
      description: `IPFS CID: ${tool.ipfsCid}`,
      value: tool,
    })),
  ];

  if (choices.length === 0) {
    throw new LawCliError(
      DelegateeErrors.NO_TOOLS_AVAILABLE,
      'No tools available to select'
    );
  }

  const { tool } = await prompts({
    type: 'select',
    name: 'tool',
    message: 'Select a tool to execute:',
    choices,
  });

  if (!tool) {
    throw new LawCliError(
      DelegateeErrors.TOOL_SELECTION_CANCELLED,
      'Tool selection was cancelled'
    );
  }

  return tool as AwTool<any, any>;
};

/**
 * Prompts the user to select a wrapped key from a list of available keys.
 */
const promptSelectWrappedKey = async (wrappedKeys: any[], pkpAddress: string) => {
  // Filter wrapped keys by pkpAddress
  const filteredKeys = wrappedKeys.filter(key => {
    return key.pkpAddress?.toLowerCase() === pkpAddress.toLowerCase();
  });

  logger.info(`Found ${filteredKeys.length} keys for PKP address ${pkpAddress}`);

  if (filteredKeys.length === 0) {
    throw new LawCliError(
      DelegateeErrors.NO_WRAPPED_KEYS_AVAILABLE,
      `No wrapped keys available for PKP address ${pkpAddress}`
    );
  }

  const { keyId } = await prompts({
    type: 'select',
    name: 'keyId',
    message: 'Select a wrapped key to use:',
    choices: filteredKeys.map((key) => ({
      title: `${key.id} (${key.publicKey})`,
      value: key.id,
    })),
  });

  if (!keyId) {
    throw new LawCliError(
      DelegateeErrors.WRAPPED_KEY_SELECTION_CANCELLED,
      'Wrapped key selection was cancelled'
    );
  }

  return keyId;
};

/**
 * Handles the process of executing a tool.
 * This function displays available tools, prompts for tool selection and parameters,
 * and executes the selected tool with the provided parameters.
 */
export const handleExecuteTool = async (
  localStorage: LocalStorage,
  delegatee: Delegatee,
  pkp: DelegatedPkpInfo
): Promise<void> => {
  try {
    // Get registered tools for the PKP
    const registeredTools = await delegatee.awDelegatee.getPermittedToolsForPkp(
      pkp.tokenId
    );

    // Check if there are any tools available
    if (
      Object.keys(registeredTools.toolsWithPolicies).length === 0 &&
      Object.keys(registeredTools.toolsWithoutPolicies).length === 0
    ) {
      logger.error('No registered tools found for this PKP.');
      return;
    }

    // Display available tools
    if (Object.keys(registeredTools.toolsWithPolicies).length > 0) {
      logger.info(`Tools with Policies for PKP ${pkp.ethAddress}:`);
      Object.values(registeredTools.toolsWithPolicies).forEach((tool) => {
        logger.log(`  - ${tool.name} (${tool.ipfsCid})`);
      });
    }

    if (Object.keys(registeredTools.toolsWithoutPolicies).length > 0) {
      logger.info(`Tools without Policies for PKP ${pkp.ethAddress}:`);
      Object.values(registeredTools.toolsWithoutPolicies).forEach((tool) => {
        logger.log(`  - ${tool.name} (${tool.ipfsCid})`);
      });
    }

    // Prompt user to select a tool
    const selectedTool = await promptSelectTool(
      Object.values(registeredTools.toolsWithPolicies),
      Object.values(registeredTools.toolsWithoutPolicies)
    );

    // If the tool has a policy, display it
    const toolWithPolicy = Object.values(
      registeredTools.toolsWithPolicies
    ).find((tool) => tool.ipfsCid === selectedTool.ipfsCid);
    if (toolWithPolicy) {
      const policy = await delegatee.awDelegatee.getToolPolicy(
        pkp.tokenId,
        selectedTool.ipfsCid
      );
      logger.info('Tool Policy:');
      logger.log(`  Policy IPFS CID: ${policy.policyIpfsCid}`);
      logger.log(`  Policy Enabled: ${policy.enabled ? '✅' : '❌'}`);
    }

    let params: { accessControlConditions?: any } = {};

    // If the tool is for Solana chain, handle wrapped key selection
    if (selectedTool.chain === 'solana') {
      // Get wrapped keys
      const wrappedKeys = await delegatee.getWrappedKeys();
      
      // Prompt for wrapped key selection, passing the pkp address
      const wrappedKeyId = await promptSelectWrappedKey(wrappedKeys, pkp.ethAddress);

      // Find the selected wrapped key
      const selectedKey = wrappedKeys.find(key => key.id === wrappedKeyId);
      if (!selectedKey) {
        throw new Error('Selected wrapped key not found');
      }

      // Get all parameters, passing wrapped key data as foundParams
      params = await getToolParams(localStorage, selectedTool, pkp.ethAddress, {
        foundParams: {
          ciphertext: selectedKey.ciphertext,
          dataToEncryptHash: selectedKey.dataToEncryptHash,
        },
      }) as any; // Cast to any to allow adding accessControlConditions
    } else {
      // For non-Solana tools, just get the regular parameters
      params = await getToolParams(localStorage, selectedTool, pkp.ethAddress) as any; // Cast to any to allow adding accessControlConditions
    }
    // Execute the tool
    logger.info('Executing tool...');
    const response = await delegatee.awDelegatee.executeTool({
      ipfsId: selectedTool.ipfsCid,
      jsParams: {
        params,
      },
    });

    logger.info('Tool executed');
    logger.log(JSON.stringify(response, null, 2));
  } catch (error) {
    if (error instanceof LawCliError) {
      if (error.type === DelegateeErrors.NO_TOOLS_AVAILABLE) {
        logger.error('No tools available for the selected PKP');
        return;
      }
      if (error.type === DelegateeErrors.TOOL_SELECTION_CANCELLED) {
        logger.error('No tool selected');
        return;
      }
      if (error.type === DelegateeErrors.TOOL_PARAMS_CANCELLED) {
        logger.error('Tool parameter input cancelled');
        return;
      }
      if (error.type === DelegateeErrors.TOOL_PARAMS_INVALID) {
        logger.error(error.message);
        return;
      }
      if (error.type === DelegateeErrors.NO_WRAPPED_KEYS_AVAILABLE) {
        logger.error('No wrapped keys available');
        return;
      }
      if (error.type === DelegateeErrors.WRAPPED_KEY_SELECTION_CANCELLED) {
        logger.error('Wrapped key selection cancelled');
        return;
      }
    }
    throw error;
  }
};
