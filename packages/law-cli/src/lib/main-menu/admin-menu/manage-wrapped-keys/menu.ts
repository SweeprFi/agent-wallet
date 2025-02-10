import prompts from 'prompts';

import { GeneralErrors, LawCliError } from '../../../core';

export enum ManageWrappedKeysMenuChoice {
  GetWrappedKeys = 'getWrappedKeys',
  MintWrappedKey = 'mintWrappedKey',
  RemoveWrappedKey = 'removeWrappedKey',
  Back = 'back',
}

const choices = [
  {
    title: 'Get All Wrapped Keys',
    value: ManageWrappedKeysMenuChoice.GetWrappedKeys,
  },
  {
    title: 'Mint New Wrapped Key',
    value: ManageWrappedKeysMenuChoice.MintWrappedKey,
  },
  {
    title: 'Remove Wrapped Key',
    value: ManageWrappedKeysMenuChoice.RemoveWrappedKey,
  },
  {
    title: 'Back',
    value: ManageWrappedKeysMenuChoice.Back,
  },
];

export const handleManageWrappedKeysMenu = async (): Promise<ManageWrappedKeysMenuChoice> => {
  const { option } = await prompts({
    type: 'select',
    name: 'option',
    message: 'What would you like to do?',
    choices,
  });

  if (!option) {
    throw new LawCliError(
      GeneralErrors.NO_ACTION_SELECTED,
      'No action selected.'
    );
  }

  return option;
}; 