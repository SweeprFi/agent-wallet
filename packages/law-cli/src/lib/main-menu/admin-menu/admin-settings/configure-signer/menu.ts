import prompts from 'prompts';

import { LawCliError, GeneralErrors, logger } from '../../../../core';

export enum ConfigureSignerMenuChoice {
  UseEoa = 'useEoa',
  UseMultiSig = 'useMultiSig',
  UsePkp = 'usePkp',
  Back = 'back',
}

export enum AdminSignerType {
  Eoa = 'eoa',
  MultiSig = 'multiSig',
  Pkp = 'pkp',
}

const promptConfigureSignerMenu =
  async (): Promise<ConfigureSignerMenuChoice> => {
    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        {
          title: 'Use EOA',
          value: ConfigureSignerMenuChoice.UseEoa,
        },
        {
          title: 'Use MultiSig',
          value: ConfigureSignerMenuChoice.UseMultiSig,
          disabled: true,
        },
        {
          title: 'Use Pkp',
          value: ConfigureSignerMenuChoice.UsePkp,
          disabled: true,
        },
        { title: 'Back', value: ConfigureSignerMenuChoice.Back },
      ],
    });

    if (!action) {
      throw new LawCliError(
        GeneralErrors.NO_ACTION_SELECTED,
        'No admin menu action selected. Please select an action to continue.'
      );
    }

    return action as ConfigureSignerMenuChoice;
  };

export const handleConfigureSignerMenu =
  async (): Promise<ConfigureSignerMenuChoice> => {
    try {
      return promptConfigureSignerMenu();
    } catch (error) {
      if (error instanceof LawCliError) {
        if (error.type === GeneralErrors.NO_ACTION_SELECTED) {
          logger.error(error.message);
          return await handleConfigureSignerMenu();
        }
      }
      throw error;
    }
  };
