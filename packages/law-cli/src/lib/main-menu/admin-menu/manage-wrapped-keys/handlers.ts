import prompts from 'prompts';
import type { Admin } from '../admin';
import type { PkpInfo } from '@lit-protocol/agent-wallet';
import { logger } from '../../../core';

// Import the WrappedKeyInfo interface
import type { WrappedKeyInfo } from '../admin';

export const handleGetWrappedKeys = async (admin: Admin) => {
  const wrappedKeys = await admin.getWrappedKeys();
  if (wrappedKeys.length === 0) {
    logger.info('No wrapped keys found.');
    return;
  }

  logger.info('Wrapped Keys:');
  wrappedKeys.forEach((key: WrappedKeyInfo) => {
    logger.info(`ID: ${key.id}`);
    logger.info(`Public Key: ${key.publicKey}`);
    logger.info(`Key Type: ${key.keyType}`);
    logger.info(`Memo: ${key.memo}`);
    logger.info('---');
  });
};

export const handleMintWrappedKey = async (admin: Admin, pkp: PkpInfo) => {
  try {
    const wrappedKey = await admin.mintWrappedKey(pkp.info.tokenId);
    logger.info('Successfully minted new wrapped key:');
    logger.info(`ID: ${wrappedKey.id}`);
    logger.info(`Public Key: ${wrappedKey.publicKey}`);
    logger.info(`Key Type: ${wrappedKey.keyType}`);
    logger.info(`Memo: ${wrappedKey.memo}`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to mint wrapped key: ${error.message}`);
    } else {
      logger.error('Failed to mint wrapped key: Unknown error');
    }
  }
};

export const handleRemoveWrappedKey = async (admin: Admin) => {
  const wrappedKeys = await admin.getWrappedKeys();
  if (wrappedKeys.length === 0) {
    logger.info('No wrapped keys found to remove.');
    return;
  }

  const { keyId } = await prompts({
    type: 'select',
    name: 'keyId',
    message: 'Select a wrapped key to remove:',
    choices: wrappedKeys.map((key: WrappedKeyInfo) => ({
      title: `${key.id} (${key.publicKey})`,
      value: key.id,
    })),
  });

  if (!keyId) {
    logger.info('No wrapped key selected for removal.');
    return;
  }

  try {
    const removedKey = await admin.removeWrappedKey(keyId);
    logger.info(`Successfully removed wrapped key: ${removedKey.id}`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to remove wrapped key: ${error.message}`);
    } else {
      logger.error('Failed to remove wrapped key: Unknown error');
    }
  }
}; 