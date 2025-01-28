import prompts from 'prompts';

import { CliSettingsMenuErrors, LawCliError, logger } from '../../core';

export enum CliSettingsMenuChoice {
  ChangeLitNetwork = 'changeLitNetwork',
  ConfigureRpcs = 'configureRpcs',
  Back = 'back',
}

const promptCliSettingsMenu = async (): Promise<CliSettingsMenuChoice> => {
  const { action } = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      {
        title: 'Change Lit Network',
        value: CliSettingsMenuChoice.ChangeLitNetwork,
      },
      { title: 'Configure RPCs', value: CliSettingsMenuChoice.ConfigureRpcs },
      { title: 'Back', value: CliSettingsMenuChoice.Back },
    ],
  });

  if (!action) {
    throw new LawCliError(
      CliSettingsMenuErrors.NO_CLI_SETTINGS_ACTION_SELECTED,
      'No CLI settings action selected. Please select an action to continue.'
    );
  }

  return action as CliSettingsMenuChoice;
};

export const handleCliSettingsMenu =
  async (): Promise<CliSettingsMenuChoice> => {
    try {
      return promptCliSettingsMenu();
    } catch (error) {
      if (error instanceof LawCliError) {
        if (
          error.type === CliSettingsMenuErrors.NO_CLI_SETTINGS_ACTION_SELECTED
        ) {
          logger.error(error.message);
          return await handleCliSettingsMenu();
        }
      }
      throw error;
    }
  };
