import prompts from 'prompts';

import { GeneralErrors, LawCliError } from '../../../core';

export enum ManagePoliciesMenuChoice {
  GetAllPolicies = 'getAllPolicies',
  GetToolPolicy = 'getToolPolicy',
  SetPolicy = 'setPolicy',
  RemovePolicy = 'removePolicy',
  EnablePolicy = 'enablePolicy',
  DisablePolicy = 'disablePolicy',
  Back = 'back',
}

const choices = [
  {
    title: 'Get All Policies for a Tool',
    value: ManagePoliciesMenuChoice.GetAllPolicies,
  },
  {
    title: 'Get Tool Policy for a Delegatee',
    value: ManagePoliciesMenuChoice.GetToolPolicy,
  },
  {
    title: 'Set Policy for a Delegatee',
    value: ManagePoliciesMenuChoice.SetPolicy,
  },
  {
    title: 'Remove Policy for a Delegatee',
    value: ManagePoliciesMenuChoice.RemovePolicy,
  },
  {
    title: 'Enable Policy for a Delegatee',
    value: ManagePoliciesMenuChoice.EnablePolicy,
  },
  {
    title: 'Disable Policy for a Delegatee',
    value: ManagePoliciesMenuChoice.DisablePolicy,
  },
  {
    title: 'Back',
    value: ManagePoliciesMenuChoice.Back,
  },
];

export const handleManagePoliciesMenu =
  async (): Promise<ManagePoliciesMenuChoice> => {
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
