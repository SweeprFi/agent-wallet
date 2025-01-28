export enum GeneralErrors {
  UNKNOWN_LAW_CLI_ERROR = 'UNKNOWN_LAW_CLI_ERROR',
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

// Combined type for all errors
export type LawCliErrorType =
  | GetLitNetworkErrors
  | GeneralErrors
  | MainMenuErrors
  | CliSettingsMenuErrors
  | ChangeLitNetworkErrors;
