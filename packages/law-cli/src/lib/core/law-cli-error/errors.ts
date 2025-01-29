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

export enum EditRpcErrors {
  EDIT_RPC_CANCELLED = 'EDIT_RPC_CANCELLED',
  NO_RPCS_FOUND = 'NO_RPCS_FOUND',
}

export enum RemoveRpcErrors {
  REMOVE_RPC_CANCELLED = 'REMOVE_RPC_CANCELLED',
  NO_RPCS_FOUND = 'NO_RPCS_FOUND',
}

export enum AdminErrors {
  ADMIN_MISSING_PRIVATE_KEY = 'ADMIN_MISSING_PRIVATE_KEY',
  FAILED_TO_INITIALIZE_ADMIN = 'FAILED_TO_INITIALIZE_ADMIN',
  NO_PKPS_FOUND = 'NO_PKPS_FOUND',
  PKP_SELECTION_CANCELLED = 'PKP_SELECTION_CANCELLED',
}

export enum PermitToolErrors {
  PERMIT_TOOL_CANCELLED = 'PERMIT_TOOL_CANCELLED',
  NO_UNPERMITTED_TOOLS = 'NO_UNPERMITTED_TOOLS',
  ENABLE_TOOL_CANCELLED = 'ENABLE_TOOL_CANCELLED',
}

// Combined type for all errors
export type LawCliErrorType =
  | GetLitNetworkErrors
  | GeneralErrors
  | MainMenuErrors
  | CliSettingsMenuErrors
  | ChangeLitNetworkErrors
  | ManageRpcsMenuErrors
  | AddRpcErrors
  | EditRpcErrors
  | RemoveRpcErrors
  | AdminErrors
  | PermitToolErrors;
