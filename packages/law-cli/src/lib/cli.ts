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
  MainMenuChoice,
  ManageRpcsMenuChoice,
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
    const sortedChains = Object.fromEntries(
      Object.entries(LIT_CHAINS).sort(([, a], [, b]) =>
        a.name.localeCompare(b.name)
      )
    );
    localStorage.setItem(StorageKeys.RPCS, JSON.stringify(sortedChains));
  }

  public static async start() {
    const localStorage = LawCli.initStorage();
    const litNetwork = await getLitNetwork(localStorage);
    const lawCli = new LawCli(localStorage, litNetwork);

    await LawCli.showMainMenu(lawCli);
  }

  public static async showMainMenu(lawCli: LawCli) {
    const option = await handleMainMenu();

    switch (option) {
      case MainMenuChoice.AdminMenu:
        break;
      case MainMenuChoice.DelegateeMenu:
        break;
      case MainMenuChoice.CliSettings:
        await LawCli.handleCliSettingsMenu(lawCli);
        break;
    }
  }

  public static async handleCliSettingsMenu(lawCli: LawCli) {
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

  public static async handleManageRpcsMenu(lawCli: LawCli) {
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
        break;
      case ManageRpcsMenuChoice.Back:
        await LawCli.handleCliSettingsMenu(lawCli);
        break;
    }
  }
}
