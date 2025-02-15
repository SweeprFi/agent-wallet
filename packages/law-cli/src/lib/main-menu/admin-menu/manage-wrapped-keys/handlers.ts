import prompts from 'prompts';
import type { Admin } from '../admin';
import type { PkpInfo } from '@lit-protocol/agent-wallet';
import { logger } from '../../../core';

// Import the WrappedKeyInfo interface
import type { WrappedKeyInfo } from '../admin';

export const handleGetWrappedKeys = async (admin: Admin, pkp?: PkpInfo) => {
  const wrappedKeys = await admin.getWrappedKeys();
  if (wrappedKeys.length === 0) {
    logger.log('No wrapped keys found.');
    return;
  }

  // Filter keys by PKP address if a PKP is provided
  const filteredKeys = pkp 
    ? wrappedKeys.filter(key => key.pkpAddress?.toLowerCase() === pkp.info.ethAddress.toLowerCase())
    : wrappedKeys;

  if (filteredKeys.length === 0) {
    logger.log(`No wrapped keys found${pkp ? ` for PKP address ${pkp.info.ethAddress}` : ''}.`);
    return;
  }

  logger.info(`Wrapped Keys${pkp ? ` for PKP ${pkp.info.ethAddress}` : ''}:`);
  filteredKeys.forEach((key: WrappedKeyInfo) => {
    logger.log(`ID: ${key.id}`);
    logger.log(`Public Key: ${key.publicKey}`);
    logger.log(`Key Type: ${key.keyType}`);
    logger.log(`PKP Address: ${key.pkpAddress}`);
    logger.log(`Memo: ${key.memo}`);
    logger.log(`Network: ${key.litNetwork}`);
    logger.log('---');
  });
};

export const handleMintWrappedKey = async (admin: Admin, pkp: PkpInfo) => {
  try {
    const wrappedKey = await admin.mintWrappedKey(pkp.info.tokenId);
    logger.log('Successfully minted new wrapped key:');
    logger.log(`ID: ${wrappedKey.id}`);
    logger.log(`Public Key: ${wrappedKey.publicKey}`);
    logger.log(`Key Type: ${wrappedKey.keyType}`);
    logger.log(`Memo: ${wrappedKey.memo}`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to mint wrapped key: ${error.message}`);
    } else {
      logger.error('Failed to mint wrapped key: Unknown error');
    }
  }
};

export const handleRemoveWrappedKey = async (admin: Admin, pkp?: PkpInfo) => {
  const wrappedKeys = await admin.getWrappedKeys();
  if (wrappedKeys.length === 0) {
    logger.log('No wrapped keys found to remove.');
    return;
  }

  // Filter keys by PKP address if a PKP is provided
  const filteredKeys = pkp 
    ? wrappedKeys.filter(key => key.pkpAddress?.toLowerCase() === pkp.info.ethAddress.toLowerCase())
    : wrappedKeys;

  if (filteredKeys.length === 0) {
    logger.log(`No wrapped keys found${pkp ? ` for PKP address ${pkp.info.ethAddress}` : ''}.`);
    return;
  }

  const { keyId } = await prompts({
    type: 'select',
    name: 'keyId',
    message: 'Select a wrapped key to remove:',
    choices: filteredKeys.map((key: WrappedKeyInfo) => ({
      title: `${key.id} (${key.publicKey})`,
      value: key.id,
    })),
  });

  if (!keyId) {
    logger.log('No wrapped key selected for removal.');
    return;
  }

  try {
    const removedKey = await admin.removeWrappedKey(keyId);
    logger.log(`Successfully removed wrapped key: ${removedKey.id}`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to remove wrapped key: ${error.message}`);
    } else {
      logger.error('Failed to remove wrapped key: Unknown error');
    }
  }
}; 