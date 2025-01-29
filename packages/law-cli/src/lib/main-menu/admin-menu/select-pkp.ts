import prompts from 'prompts';
import { PkpInfo } from '@lit-protocol/agent-wallet';

import { Admin } from './admin';
import { LawCliError, AdminErrors, logger } from '../../core';

const promptSelectPkp = async (admin: Admin) => {
  const pkps = await admin.awAdmin.getPkps();

  if (pkps.length === 0) {
    throw new LawCliError(
      AdminErrors.NO_PKPS_FOUND,
      'No PKPs found. Please mint a PKP first.'
    );
  }

  const { pkp } = await prompts({
    type: 'select',
    name: 'pkp',
    message: 'Select a PKP to manage:',
    choices: pkps.map((pkp, i) => ({
      title: `${i + 1}: ${pkp.info.ethAddress}`,
      description: `Token ID: ${pkp.info.tokenId}`,
      value: pkp,
    })),
  });

  if (!pkp) {
    throw new LawCliError(
      AdminErrors.PKP_SELECTION_CANCELLED,
      'PKP selection cancelled.'
    );
  }

  return pkp;
};

export const handleSelectPkp = async (admin: Admin): Promise<PkpInfo> => {
  try {
    return promptSelectPkp(admin);
  } catch (error) {
    if (error instanceof LawCliError) {
      if (error.type === AdminErrors.NO_PKPS_FOUND) {
        logger.error(error.message);
        throw error;
      }
      // This is sorta pointless, but making it explicit that this is an error
      // type that could be thrown for handling upstream.
      if (error.type === AdminErrors.PKP_SELECTION_CANCELLED) {
        throw error;
      }
    }
    throw error;
  }
};
