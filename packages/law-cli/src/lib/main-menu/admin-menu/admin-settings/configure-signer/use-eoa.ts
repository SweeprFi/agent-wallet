import prompts from 'prompts';

import {
  LocalStorage,
  StorageKeys,
  LawCliError,
  AdminErrors,
  logger,
  getLitNetwork,
} from '../../../../core';
import { AdminSignerType } from './menu';
import { Admin } from '../../admin';

const promptPrivateKey = async (): Promise<string> => {
  const { privateKey } = await prompts({
    type: 'password',
    name: 'privateKey',
    message: 'Enter your private key:',
    validate: (value) => {
      // Basic validation for private key format (0x followed by 64 hex characters)
      const isValidFormat = /^0x[0-9a-fA-F]{64}$/.test(value);
      return isValidFormat
        ? true
        : 'Please enter a valid private key (0x followed by 64 hex characters)';
    },
  });

  if (!privateKey) {
    throw new LawCliError(
      AdminErrors.ADMIN_MISSING_PRIVATE_KEY,
      'No private key provided. Operation cancelled.'
    );
  }

  return privateKey;
};

export const handleUseEoa = async (
  localStorage: LocalStorage
): Promise<Admin> => {
  try {
    const privateKey = await promptPrivateKey();
    localStorage.setItem(StorageKeys.ADMIN_PRIVATE_KEY, privateKey);
    localStorage.setItem(StorageKeys.ADMIN_SIGNER_TYPE, AdminSignerType.Eoa);

    const awAdmin = await Admin.create(
      await getLitNetwork(localStorage),
      privateKey
    );

    logger.success('EOA signer configured successfully');

    return awAdmin;
  } catch (error) {
    if (error instanceof LawCliError) {
      if (error.type === AdminErrors.ADMIN_MISSING_PRIVATE_KEY) {
        logger.error(error.message);
        return await handleUseEoa(localStorage);
      }

      if (error.type === AdminErrors.FAILED_TO_INITIALIZE_ADMIN) {
        logger.error(error.message);
        return await handleUseEoa(localStorage);
      }
    }
    throw error;
  }
};
