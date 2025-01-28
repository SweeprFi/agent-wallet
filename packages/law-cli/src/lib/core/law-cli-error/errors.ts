export enum GeneralErrors {
  UNKNOWN_LAW_CLI_ERROR = 'UNKNOWN_LAW_CLI_ERROR',
  NO_ACTION_SELECTED = 'NO_ACTION_SELECTED',
}

export enum GetLitNetworkErrors {
  NO_LIT_NETWORK_SELECTED = 'NO_LIT_NETWORK_SELECTED',
}

export enum MainMenuErrors {
  NO_MAIN_MENU_ACTION_SELECTED = 'NO_MAIN_MENU_ACTION_SELECTED',
  UNKNOWN_MAIN_MENU_ACTION = 'UNKNOWN_MAIN_MENU_ACTION',
}

export enum CliSettingsMenuErrors {
  NO_CLI_SETTINGS_ACTION_SELECTED = 'NO_CLI_SETTINGS_ACTION_SELECTED',
  UNKNOWN_CLI_SETTINGS_ACTION = 'UNKNOWN_CLI_SETTINGS_ACTION',
}

export enum ChangeLitNetworkErrors {
  NO_LIT_NETWORK_SELECTED = 'NO_LIT_NETWORK_SELECTED',
}

export enum ManageRpcsMenuErrors {
  UNKNOWN_RPC_ACTION = 'UNKNOWN_RPC_ACTION',
}

export enum AddRpcErrors {
  CHAIN_NAME_EXISTS = 'CHAIN_NAME_EXISTS',
  ADD_RPC_CANCELLED = 'ADD_RPC_CANCELLED',
}

// Combined type for all errors
export type LawCliErrorType =
  | GetLitNetworkErrors
  | GeneralErrors
  | MainMenuErrors
  | CliSettingsMenuErrors
  | ChangeLitNetworkErrors
  | ManageRpcsMenuErrors
  | AddRpcErrors;
