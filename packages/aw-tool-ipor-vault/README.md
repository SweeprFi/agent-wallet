# AW-Tool IporVault Documentation

The `aw-tool-ipor-vault` package provides functionality for interacting with IPOR Vaults using the ERC4626 standard. This tool enables secure depositing and withdrawing of assets while enforcing policy-based controls.

---

## Files Overview (in src/lib)

### 1. **`ipfs.ts`**
Handles IPFS CIDs for different environments (development, testing, production). Falls back to default CIDs if the build output is not found.

#### Key Features:
- **Default CIDs**: Predefined CIDs for `datil-dev`, `datil-test`, and `datil` environments
- **Dynamic CID Loading**: Attempts to load CIDs from `dist/ipfs.json` at runtime
- **Fallback Mechanism**: Uses default CIDs if the file is missing or unreadable

---

### 2. **`lit-action.ts`**
Contains the main logic for executing IPOR Vault operations.

#### Key Features:
- **PKP Info Retrieval**: Fetches PKP details (token ID, Ethereum address, public key) from the PubkeyRouter contract
- **Delegatee Validation**: Verifies that the session signer is a valid delegatee for the PKP
- **Policy Enforcement**: Validates vault addresses and amounts against the policy
- **Vault Operations**: Handles deposits and withdrawals through ERC4626 standard
- **Error Handling**: Comprehensive error handling and response formatting

---

### 3. **`policy.ts`**
Defines and validates the IPOR Vault policy schema using Zod.

#### Key Features:
- **Policy Schema**: Validates policy fields:
  - `type`: Must be 'IporVault'
  - `version`: Policy version string
  - `allowedVaults`: Array of allowed vault addresses
  - `maxAmount`: Maximum amount allowed for operations
- **Encoding/Decoding**: Converts policies to and from ABI-encoded strings using ethers
- **Type Safety**: Uses Zod for schema validation and TypeScript type inference

---

### 4. **`tool.ts`**
Configures the IPOR Vault tool for different Lit networks.

#### Key Features:
- **Parameter Schema**: Validates required parameters:
  - `pkpEthAddress`: The Ethereum address of the PKP
  - `action`: The operation to perform ('deposit', 'redeem', or 'value')
  - `amount`: The amount to deposit or redeem
  - `vault`: The IPOR vault address
  - `rpcUrl`: The RPC URL for the blockchain network
- **Network Configuration**: Creates network-specific tools for each supported Lit network
- **Tool Definition**: Implements the `AwTool` interface with:
  - Name and description
  - Parameter validation and descriptions
  - Policy integration with `IporVaultPolicy`
