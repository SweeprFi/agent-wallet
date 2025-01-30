import { LitNetwork, type PkpInfo } from '@lit-protocol/agent-wallet';
import { LIT_CHAINS } from '@lit-protocol/constants';

import {
  AdminErrors,
  getLitNetwork,
  LawCliError,
  LocalStorage,
  logger,
  StorageKeys,
} from './core';
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
  ManageToolsMenuChoice,
  handleManageToolsMenu,
  handleSelectPkp,
  handlePermitTool,
  handleRemoveTool,
  handleEnableTool,
  handleDisableTool,
  handleGetTools,
  handleGetPolicies,
  ManagePoliciesMenuChoice,
  handleDisablePolicy,
  handleEnablePolicy,
  handleRemovePolicy,
  handleSetPolicy,
  handleManagePoliciesMenu,
  handleGetToolPolicy,
  handleManageDelegateesMenu,
  handleIsDelegatee,
  handleRemoveDelegatee,
  handleAddDelegatee,
  handleGetDelegatees,
  ManageDelegateesMenuChoice,
  handlePermitToolForDelegatee,
  handleUnpermitToolForDelegatee,
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

  private static async handleSelectPkp(lawCli: LawCli, admin: Admin) {
    try {
      return await handleSelectPkp(admin);
    } catch (error) {
      if (error instanceof LawCliError) {
        if (
          error.type === AdminErrors.NO_PKPS_FOUND ||
          error.type === AdminErrors.PKP_SELECTION_CANCELLED
        ) {
          await LawCli.handleAdminMenu(lawCli, admin);
        }
      }
      throw error;
    }
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

  private static async handleAdminMenu(
    lawCli: LawCli,
    admin?: Admin,
    pkp?: PkpInfo
  ) {
    // If an instance of Admin is not provided, prompt the user to configure an Admin signer
    if (admin === undefined) {
      const adminPrivateKey = lawCli.localStorage.getItem(
        StorageKeys.ADMIN_PRIVATE_KEY
      );

      if (adminPrivateKey) {
        admin = await Admin.create(lawCli.litNetwork, adminPrivateKey);
      } else {
        // Recursively calls handleAdminMenu, passing in the new Admin instance
        await LawCli.handleAdminConfigureSignerMenu(lawCli);
      }
    }

    const option = await handleAdminMenu(admin);

    switch (option) {
      case AdminMenuChoice.AdminSettings:
        await LawCli.handleAdminSettingsMenu(lawCli, admin);
        break;
      case AdminMenuChoice.ManageTools:
        if (pkp === undefined) {
          pkp = await LawCli.handleSelectPkp(lawCli, admin!);
        }
        await LawCli.handleManageToolsMenu(lawCli, admin!, pkp);
        break;
      case AdminMenuChoice.ManagePolicies:
        if (pkp === undefined) {
          pkp = await LawCli.handleSelectPkp(lawCli, admin!);
        }
        await LawCli.handleManagePoliciesMenu(lawCli, admin!, pkp);
        break;
      case AdminMenuChoice.ManageDelegatees:
        if (pkp === undefined) {
          pkp = await LawCli.handleSelectPkp(lawCli, admin!);
        }
        await LawCli.handleManageDelegateesMenu(lawCli, admin!, pkp);
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

  private static async handleManageToolsMenu(
    lawCli: LawCli,
    admin: Admin,
    pkp: PkpInfo
  ) {
    const option = await handleManageToolsMenu();

    switch (option) {
      case ManageToolsMenuChoice.GetRegisteredTools:
        await handleGetTools(admin, pkp);
        await LawCli.handleManageToolsMenu(lawCli, admin, pkp);
        break;
      case ManageToolsMenuChoice.PermitTool:
        await handlePermitTool(admin, pkp);
        await LawCli.handleManageToolsMenu(lawCli, admin, pkp);
        break;
      case ManageToolsMenuChoice.RemoveTool:
        await handleRemoveTool(admin, pkp);
        await LawCli.handleManageToolsMenu(lawCli, admin, pkp);
        break;
      case ManageToolsMenuChoice.EnableTool:
        await handleEnableTool(admin, pkp);
        await LawCli.handleManageToolsMenu(lawCli, admin, pkp);
        break;
      case ManageToolsMenuChoice.DisableTool:
        await handleDisableTool(admin, pkp);
        await LawCli.handleManageToolsMenu(lawCli, admin, pkp);
        break;
      case ManageToolsMenuChoice.Back:
        await LawCli.handleAdminMenu(lawCli, admin, pkp);
        break;
    }
  }

  private static async handleManagePoliciesMenu(
    lawCli: LawCli,
    admin: Admin,
    pkp: PkpInfo
  ) {
    const option = await handleManagePoliciesMenu();

    switch (option) {
      case ManagePoliciesMenuChoice.GetAllPolicies:
        await handleGetPolicies(admin, pkp);
        await LawCli.handleManagePoliciesMenu(lawCli, admin, pkp);
        break;
      case ManagePoliciesMenuChoice.GetToolPolicy:
        await handleGetToolPolicy(admin, pkp);
        await LawCli.handleManagePoliciesMenu(lawCli, admin, pkp);
        break;
      case ManagePoliciesMenuChoice.SetPolicy:
        await handleSetPolicy(admin, pkp);
        await LawCli.handleManagePoliciesMenu(lawCli, admin, pkp);
        break;
      case ManagePoliciesMenuChoice.RemovePolicy:
        await handleRemovePolicy(admin, pkp);
        await LawCli.handleManagePoliciesMenu(lawCli, admin, pkp);
        break;
      case ManagePoliciesMenuChoice.EnablePolicy:
        await handleEnablePolicy(admin, pkp);
        await LawCli.handleManagePoliciesMenu(lawCli, admin, pkp);
        break;
      case ManagePoliciesMenuChoice.DisablePolicy:
        await handleDisablePolicy(admin, pkp);
        await LawCli.handleManagePoliciesMenu(lawCli, admin, pkp);
        break;
      case ManagePoliciesMenuChoice.Back:
        await LawCli.handleAdminMenu(lawCli, admin, pkp);
        break;
    }
  }

  private static async handleManageDelegateesMenu(
    lawCli: LawCli,
    admin: Admin,
    pkp: PkpInfo
  ) {
    const option = await handleManageDelegateesMenu();

    switch (option) {
      case ManageDelegateesMenuChoice.GetDelegatees:
        await handleGetDelegatees(admin, pkp);
        await LawCli.handleManageDelegateesMenu(lawCli, admin, pkp);
        break;
      case ManageDelegateesMenuChoice.IsDelegatee:
        await handleIsDelegatee(admin, pkp);
        await LawCli.handleManageDelegateesMenu(lawCli, admin, pkp);
        break;
      case ManageDelegateesMenuChoice.AddDelegatee:
        await handleAddDelegatee(admin, pkp);
        await LawCli.handleManageDelegateesMenu(lawCli, admin, pkp);
        break;
      case ManageDelegateesMenuChoice.RemoveDelegatee:
        await handleRemoveDelegatee(admin, pkp);
        await LawCli.handleManageDelegateesMenu(lawCli, admin, pkp);
        break;
      case ManageDelegateesMenuChoice.PermitTool:
        await handlePermitToolForDelegatee(admin, pkp);
        await LawCli.handleManageDelegateesMenu(lawCli, admin, pkp);
        break;
      case ManageDelegateesMenuChoice.UnpermitTool:
        await handleUnpermitToolForDelegatee(admin, pkp);
        await LawCli.handleManageDelegateesMenu(lawCli, admin, pkp);
        break;
      case ManageDelegateesMenuChoice.Back:
        await LawCli.handleAdminMenu(lawCli, admin, pkp);
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
