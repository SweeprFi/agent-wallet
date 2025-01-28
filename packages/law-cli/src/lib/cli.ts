import { LitNetwork } from '@lit-protocol/agent-wallet';

import { getLitNetwork, LocalStorage, logger } from './core';
import {
  CliSettingsMenuChoice,
  handleChangeLitNetwork,
  handleCliSettingsMenu,
  handleMainMenu,
  MainMenuChoice,
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
  }

  private static initStorage() {
    return new LocalStorage(LawCli.DEFAULT_STORAGE_PATH);
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
        await LawCli.handleCliSettingsMenu(lawCli);
        break;
      case CliSettingsMenuChoice.ConfigureRpcs:
        break;
      case CliSettingsMenuChoice.Back:
        await LawCli.showMainMenu(lawCli);
        break;
    }
  }
}
