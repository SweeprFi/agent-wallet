# AW-Tool CctpUsdc Documentation

The `aw-tool-cctp-usdc` package provides functionality for performing cross-chain USDC transfers using Circle's Cross-Chain Transfer Protocol (CCTP). This tool enables secure and efficient USDC transfers between supported networks while enforcing policy-based controls.

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
Contains the main logic for executing CCTP USDC transfers across different networks.

#### Key Features:
- **PKP Info Retrieval**: Fetches PKP details (token ID, Ethereum address, public key) from the PubkeyRouter contract
- **Delegatee Validation**: Verifies that the session signer is a valid delegatee for the PKP
- **Policy Enforcement**: Validates transfer amounts against the maximum allowed amount in the policy
- **Cross-Chain Transfer**: Handles both sending (burn) and receiving (mint) USDC across chains
- **Error Handling**: Comprehensive error handling and response formatting

---

### 3. **`policy.ts`**
Defines and validates the CCTP USDC transfer policy schema using Zod.

#### Key Features:
- **Policy Schema**: Validates policy fields:
  - `type`: Must be 'CctpUsdc'
  - `version`: Policy version string
  - `maxAmount`: Maximum amount allowed for transfers
- **Encoding/Decoding**: Converts policies to and from ABI-encoded strings using ethers
- **Type Safety**: Uses Zod for schema validation and TypeScript type inference

---

### 4. **`tool.ts`**
Configures the CCTP USDC transfer tool for different Lit networks.

#### Key Features:
- **Parameter Schema**: Validates required parameters:
  - `pkpEthAddress`: The Ethereum address of the PKP
  - `action`: The transfer action ('send' or 'receive')
  - `opChainId`: The destination chain ID for sending or source chain ID for receiving
  - `amount`: The amount of USDC to transfer
  - `burnTx`: The burn transaction hash (required for receive action)
  - `rpcUrl`: The RPC URL for the source chain
- **Network Configuration**: Creates network-specific tools for each supported Lit network
- **Tool Definition**: Implements the `AwTool` interface with:
  - Name and description
  - Parameter validation and descriptions
  - Policy integration with `CctpUsdcPolicy`
