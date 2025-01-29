import { LitNetwork } from '@lit-protocol/agent-wallet';
import { LIT_CHAINS } from '@lit-protocol/constants';

import { getLitNetwork, LocalStorage, logger, StorageKeys } from './core';
import {
  CliSettingsMenuChoice,
  handleAddRpc,
  handleChangeLitNetwork,
  handleCliSettingsMenu,
  handleEditRpc,
  handleMainMenu,
  handleManageRpcsMenu,
  handleRemoveRpc,
  MainMenuChoice,
  ManageRpcsMenuChoice,
  AdminMenuChoice,
  handleAdminMenu,
  handleAdminSettingsMenu,
  AdminSettingsMenuChoice,
  handleConfigureSignerMenu,
  ConfigureSignerMenuChoice,
  handleUseEoa,
  Admin,
} from './main-menu';

export class LawCli {
  private static readonly DEFAULT_STORAGE_PATH = './.law-cli-storage';

  private localStorage: LocalStorage;

  public litNetwork: LitNetwork;

  private constructor(localStorage: LocalStorage, litNetwork: LitNetwork) {
    this.localStorage = localStorage;
    this.litNetwork = litNetwork;

    logger.info(`CLI storage loading from: ${LawCli.DEFAULT_STORAGE_PATH}`);
    logger.info(`Using Lit network: ${this.litNetwork}`);

    LawCli.populateDefaultRpcs(localStorage);
  }

  private static initStorage() {
    return new LocalStorage(LawCli.DEFAULT_STORAGE_PATH);
  }

  private static populateDefaultRpcs(localStorage: LocalStorage) {
    // Check if RPCs already exist
    const existingRpcsString = localStorage.getItem(StorageKeys.RPCS);
    if (existingRpcsString) {
      return; // RPCs already exist, don't overwrite them
    }

    // Only populate default RPCs if none exist
    const sortedChains = Object.fromEntries(
      Object.entries(LIT_CHAINS).sort(([, a], [, b]) =>
        a.name.localeCompare(b.name)
      )
    );
    localStorage.setItem(StorageKeys.RPCS, JSON.stringify(sortedChains));
  }

  private static async showMainMenu(lawCli: LawCli, admin?: Admin) {
    const option = await handleMainMenu();

    switch (option) {
      case MainMenuChoice.AdminMenu:
        await LawCli.handleAdminMenu(lawCli, admin);
        break;
      case MainMenuChoice.DelegateeMenu:
        break;
      case MainMenuChoice.CliSettings:
        await LawCli.handleCliSettingsMenu(lawCli);
        break;
    }

    // If we reach this point, that means the user has exited the CLI,
    // or one of the CLI options didn't loop back to a menu.
    if (admin !== undefined) {
      admin.awAdmin.disconnect();
    }

    process.exit(0);
  }

  private static async handleCliSettingsMenu(lawCli: LawCli) {
    const cliSettingsOption = await handleCliSettingsMenu();

    switch (cliSettingsOption) {
      case CliSettingsMenuChoice.ChangeLitNetwork:
        await handleChangeLitNetwork(lawCli.localStorage);

        // Return to the CLI settings menu after changing the Lit network
        await LawCli.handleCliSettingsMenu(lawCli);
        break;
      case CliSettingsMenuChoice.ManageRpcs:
        await LawCli.handleManageRpcsMenu(lawCli);
        break;
      case CliSettingsMenuChoice.Back:
        await LawCli.showMainMenu(lawCli);
        break;
    }
  }

  private static async handleManageRpcsMenu(lawCli: LawCli) {
    const manageRpcsOption = await handleManageRpcsMenu();

    switch (manageRpcsOption) {
      case ManageRpcsMenuChoice.AddRpc:
        await handleAddRpc(lawCli.localStorage);

        // Return to the manage RPCs menu after
        await LawCli.handleManageRpcsMenu(lawCli);
        break;
      case ManageRpcsMenuChoice.EditRpc:
        await handleEditRpc(lawCli.localStorage);

        // Return to the manage RPCs menu after
        await LawCli.handleManageRpcsMenu(lawCli);
        break;
      case ManageRpcsMenuChoice.RemoveRpc:
        await handleRemoveRpc(lawCli.localStorage);

        // Return to the manage RPCs menu after
        await LawCli.handleManageRpcsMenu(lawCli);
        break;
      case ManageRpcsMenuChoice.Back:
        await LawCli.handleCliSettingsMenu(lawCli);
        break;
    }
  }

  private static async handleAdminMenu(lawCli: LawCli, admin?: Admin) {
    // If an instance of Admin is not provided, prompt the user to configure an Admin signer
    if (admin === undefined) {
      const adminPrivateKey = lawCli.localStorage.getItem(
        StorageKeys.ADMIN_PRIVATE_KEY
      );

      if (adminPrivateKey) {
        admin = await Admin.create(lawCli.litNetwork, adminPrivateKey);
      } else {
        await LawCli.handleAdminConfigureSignerMenu(lawCli);
      }
    }

    const option = await handleAdminMenu(admin);

    switch (option) {
      case AdminMenuChoice.AdminSettings:
        await LawCli.handleAdminSettingsMenu(lawCli, admin);
        break;
      case AdminMenuChoice.ManageTools:
        break;
      case AdminMenuChoice.ManagePolicies:
        break;
      case AdminMenuChoice.ManageDelegatees:
        break;
      case AdminMenuChoice.Back:
        await LawCli.showMainMenu(lawCli, admin);
        break;
    }
  }

  private static async handleAdminSettingsMenu(lawCli: LawCli, admin?: Admin) {
    const option = await handleAdminSettingsMenu();

    switch (option) {
      case AdminSettingsMenuChoice.ConfigureSigner: {
        await LawCli.handleAdminConfigureSignerMenu(lawCli, admin);
        break;
      }
      case AdminSettingsMenuChoice.Back:
        await LawCli.handleAdminMenu(lawCli, admin);
        break;
    }
  }

  private static async handleAdminConfigureSignerMenu(
    lawCli: LawCli,
    admin?: Admin
  ) {
    const signerOption = await handleConfigureSignerMenu();

    switch (signerOption) {
      case ConfigureSignerMenuChoice.UseEoa: {
        const admin = await handleUseEoa(lawCli.localStorage);
        await LawCli.handleAdminMenu(lawCli, admin);
        break;
      }
      case ConfigureSignerMenuChoice.UseMultiSig:
        break;
      case ConfigureSignerMenuChoice.UsePkp:
        break;
      case ConfigureSignerMenuChoice.Back:
        await LawCli.handleAdminSettingsMenu(lawCli, admin);
        break;
    }
  }

  public static async start() {
    const localStorage = LawCli.initStorage();
    const litNetwork = await getLitNetwork(localStorage);
    const lawCli = new LawCli(localStorage, litNetwork);

    await LawCli.showMainMenu(lawCli);
  }
}
