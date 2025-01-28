// import prompts from 'prompts';
// import type { LitNetwork } from '@lit-protocol/agent-wallet';

// import {
//   ChangeLitNetworkErrors,
//   LawCliError,
//   LocalStorage,
//   logger,
//   StorageKeys,
// } from '../../../core';

// const promptSelectNetwork = async (
//   existingRpcs: Record<string, { name: string }>
// ): Promise<LitNetwork> => {
//   const { network } = await prompts({
//     type: 'autocomplete',
//     name: 'network',
//     message: 'Select a Lit network (start typing to filter):',
//     choices: Object.entries(existingRpcs)
//       .map(([key, rpc]) => ({
//         title: rpc.name.trim().replace(/\s+/g, ' '),
//         value: key,
//       }))
//       .sort((a, b) => a.title.localeCompare(b.title)),
//     suggest: async (input: string, choices) => {
//       const inputLower = input.toLowerCase();
//       return choices.filter((choice) =>
//         choice.title.toLowerCase().includes(inputLower)
//       );
//     },
//   });

//   if (!network) {
//     throw new LawCliError(
//       ChangeLitNetworkErrors.NO_LIT_NETWORK_SELECTED,
//       'No Lit network selected. Please select a network to continue.'
//     );
//   }

//   return network as LitNetwork;
// };

// export const handleManageRpcs = async (localStorage: LocalStorage) => {
//   try {
//     const existingRpcsString = localStorage.getItem(StorageKeys.RPCS);
//     const existingRpcs = existingRpcsString
//       ? JSON.parse(existingRpcsString)
//       : {};

//     if (Object.keys(existingRpcs).length === 0) {
//       // TODO Maybe called LawCli.populateDefaultRpcs(localStorage);
//       // maybe add a prompt to add RPCs
//       throw new Error('No RPCs found.');
//     }

//     const selectedNetwork = await promptSelectNetwork(existingRpcs);
//   } catch (error) {
//     if (error instanceof LawCliError) {
//       if (error.type === ChangeLitNetworkErrors.NO_LIT_NETWORK_SELECTED) {
//         logger.error(error.message);
//         return handleManageRpcs(localStorage);
//       }
//     }
//     throw error;
//   }
// };
