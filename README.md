# Hedera Token Service (HTS) Contracts Demo

A comprehensive demonstration of creating and managing Hedera Token Service (HTS) tokens using smart contracts and precompile functions. This project showcases three different methods for transferring HTS tokens to new EVM addresses, each demonstrating automatic account creation with unlimited token associations.

## Table of Contents

- [Overview](#overview)
- [Understanding HTS Auto-Association](#understanding-hts-auto-association)
- [Three Transfer Methods](#three-transfer-methods)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Detailed Usage](#detailed-usage)
- [Project Structure](#project-structure)
- [Important Notes](#important-notes)

## Overview

This project demonstrates how to interact with Hedera Token Service (HTS) tokens through smart contracts using the HTS precompile system contracts. It showcases token creation, minting, and three different transfer methods that all trigger automatic account creation for new EVM addresses.

## Understanding HTS Auto-Association

### Key Concept: Automatic Account Creation with Unlimited Associations

When you send HBAR or any HTS token to an EVM address for the first time, the Hedera network automatically:

1. **Creates a new Hedera account** for that EVM address
2. **Sets `maxAutoAssociations` to `-1` (unlimited)** - This is the default behavior for auto-created accounts

This automatic behavior applies whether you:

- Use the Hedera SDK (via HAPI - Hedera API)
- Use the JSON-RPC Relay (via smart contracts)

### Important Distinction: HTS vs ERC20/ERC721

- HTS tokens(whether fungible or non-fungible) can be created at the native layer since HTS is a native service of Hedera. This could be done using HAPI(via SDK) or using system contracts(precompiles) via smart contracts(though this will likely cost more on the EVM side). Once an HTS token is created, you can transfer it using HAPI or smart contracts and you can treat them as typical ERC20/ERC721 as the HTS tokens enable the same functionalities such as `.approve()`, `transferFrom()`, etc.
- Standard ERC20/ERC721 tokens can be created via smart contracts directly and these tokens are not the same thing as HTS as these are not native and are stricly able to be interacted with only from the Hedera EVM. You can only interact with these tokens from smart contracts

### The Power of HTS

HTS tokens offer flexibility as you can interact with them through:

1. **Native Hedera SDKs** (via HAPI) - for account-based operations
2. **Smart Contract Layer** (via JSON-RPC Relay) - for EVM-compatible operations

This dual-interface capability makes HTS tokens unique and powerful for cross-platform integration.

## Three Transfer Methods

This project demonstrates three different HTS precompile methods for transferring tokens to new EVM addresses. Each method successfully creates a new account with unlimited auto-associations:

### 1. `transferTokenPublic` (Direct Transfer)

**File:** `scripts/transferTokenPublic.ts`

**What it does:**

- Simple, direct token transfer
- Uses the `transferToken` HTS precompile
- Similar to calling `transfer()` in ERC20. One could also call `HTSTokenAddress.transfer()` directly from an EOA rather than using the precompile `transferToken` via a smart contract call. This is possible because Hedera exposes this method via facade mechanism whereby the function can be called directly on a given token address similar to how ERC20/ERC721 works on EVM.

**Use case:**

- Straightforward token transfers
- When you control the sending account
- Simple one-to-one transfers

**Flow:**

1. Mint tokens to treasury (contract address)
2. Transfer tokens directly from treasury to recipient

```typescript
await contract.transferTokenPublic(
  tokenAddress,
  senderAddress,
  receiverAddress,
  amount
);
```

### 2. `cryptoTransferPublic` (Atomic Multi-Transfer)

**File:** `scripts/cryptoTransfer.ts`

**What it does:**

- Most flexible transfer method
- Can handle multiple token transfers AND HBAR transfers in a single atomic transaction
- Uses the `cryptoTransfer` HTS precompile

**Use case:**

- Complex multi-party transfers
- Atomic swaps
- Batch payments
- When you need to transfer multiple tokens or combine HBAR + token transfers

**Flow:**

1. Mint tokens to treasury
2. Build transfer lists (HBAR transfers + token transfers)
3. Execute atomic transfer

```typescript
const transferList = {
  transfers: [] // HBAR transfers
};

const tokenTransferList = [
  {
    token: tokenAddress,
    transfers: [
      { accountID: sender, amount: -10, isApproval: false },
      { accountID: receiver, amount: 10, isApproval: false }
    ],
    nftTransfers: []
  }
];

await contract.cryptoTransferPublic(transferList, tokenTransferList);
```

### 3. `transferFromPublic` (Allowance-Based Transfer)

**File:** `scripts/transferFrom.ts`

**What it does:**

- ERC20-style allowance mechanism
- Requires approval before transfer
- Uses `approve` + `transferFrom` HTS precompiles. One could also call `HTSTokenAddress.approve()` and `HTSTokenAddress.transferFrin()` directly from an EOA rather than using the precompiles via a smart contract call. This is possible because Hedera exposes these methods via facade mechanism whereby the functions can be called directly on a given token address similar to how ERC20/ERC721 works on EVM.

**Use case:**

- When you want to delegate spending authority
- Smart contract interactions (DEXs, staking contracts)
- Third-party transfers

**Flow:**

1. Mint tokens to treasury
2. Approve spender for specific amount
3. Execute transferFrom (spender transfers owner's tokens)

```typescript
// Step 1: Approve
await contract.approvePublic(tokenAddress, spenderAddress, amount);

// Step 2: Transfer from
await contract.transferFromPublic(tokenAddress, fromAddress, toAddress, amount);
```

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A Hedera testnet account with HBAR
- Private key for the account

## Installation

1. Clone the repository:

```bash
git clone https://github.com/kpachhai/hts-contracts-demo.git
cd hts-contracts-demo
```

2. Install dependencies:

```bash
npm install
```

3. Configure your Hedera account:
   - Set up your testnet credentials in the Hardhat configuration
   - Ensure you have sufficient HBAR for deployment and transactions

## Quick Start

Follow these steps in order:

### Step 1: Deploy the Contract

```bash
npx hardhat run scripts/deploy.ts
```

**Output:**

```
HTSContract deployed at: 0xF528bCa958Da0E7Ab35f77a7561B55519Fbcec68
```

**Action:** Update `scripts/config.ts` with the deployed contract address:

```typescript
htsContractAddress: "0xF528bCa958Da0E7Ab35f77a7561B55519Fbcec68";
```

### Step 2: Create an HTS Token

```bash
npx hardhat run scripts/createHTSToken.ts
```

**Output:**

```
Token Address: 0x000000000000000000000000000000000072422b
```

**Action:** Update `scripts/config.ts` with the token address:

```typescript
fungibleTokenAddress: "0x000000000000000000000000000000000072422b";
```

### Step 3: Test the Three Transfer Methods

Ensure `config.ts` has both addresses configured, then run:

```bash
# Test Method 1: Direct Transfer
npx hardhat run scripts/transferTokenPublic.ts

# Test Method 2: Crypto Transfer
npx hardhat run scripts/cryptoTransfer.ts

# Test Method 3: Transfer From
npx hardhat run scripts/transferFrom.ts
```

## Detailed Usage

### Creating Custom Tokens

Modify token parameters in `scripts/config.ts`:

```typescript
defaultTokenParams: {
  name:  "MyFungibleToken",
  symbol: "MFT",
  memo: "My HTS fungible token",
  initialSupply: 1000000n,
  maxSupply: 10000000n,
  decimals: 0,
  freezeDefault: false,
  hbarToSend: "10" // HBAR sent with token creation
}
```

### Understanding Token Keys

The project sets up two essential keys for the HTS token:

1. **ADMIN Key (keyType: 1)** - Allows administrative operations
2. **SUPPLY Key (keyType: 16)** - Allows minting and burning tokens

Both keys are assigned to the contract address, giving the contract full control over token management.

Available key types:

- `ADMIN = 1`
- `KYC = 2`
- `FREEZE = 4`
- `WIPE = 8`
- `SUPPLY = 16`
- `FEE = 32`
- `PAUSE = 64`

## Project Structure

```
hts-contracts-demo/
├── contracts/
│   └── CreateAndManageHTSTokens.sol  # Main HTS wrapper contract
├── scripts/
│   ├── config.ts                      # Configuration file
│   ├── deploy.ts                      # Deploy the contract
│   ├── createHTSToken.ts             # Create HTS token
│   ├── transferTokenPublic.ts        # Method 1: Direct transfer
│   ├── cryptoTransfer.ts             # Method 2: Crypto transfer
│   └── transferFrom.ts               # Method 3: Allowance transfer
├── hardhat.config.ts                  # Hardhat configuration
└── README.md
```

## Important Notes

### Response Codes

All HTS operations return response codes. A response code of `22` indicates `SUCCESS`:

```
Response code: 22  ✅ Success
```

Other codes indicate various error conditions as defined in `HederaResponseCodes. sol`.

### Gas Limits

Different operations require different gas limits:

- **Token Creation:** ~200,000 gas
- **Minting:** ~75,000 gas
- **Transfer:** ~1,500,000 gas (higher for first-time recipients due to account creation)
- **Approve:** ~800,000 gas
- **TransferFrom:** ~2,000,000 gas

### HBAR Requirements

Token creation requires HBAR to be sent with the transaction (default: 10 HBAR) to cover:

- Initial token creation fee
- Auto-renewal fees for the token entity

### Auto-Created Accounts

When tokens are transferred to new EVM addresses:

- A Hedera account is automatically created
- `maxAutoAssociations` is set to `-1` (unlimited)
- The account can receive any HTS token without manual association
- This works for both SDK and JSON-RPC Relay transactions

### Verification

To verify the contract on HashScan or similar explorers, use the metadata generation script:

```bash
./generate_hedera_sc_metadata.sh CreateAndManageHTSTokens
```

This generates verification bundles in `verify-bundles/MANIFEST.txt` and also `metadata.json` which can be uploaded to Hashscan manually for verification purposes.

## Transaction Examples

### Successful Transfer Output

```
============================================================
Test:  Mint & Transfer to Random EVM Address
============================================================
Using account: 0xA98556A4deeB07f21f8a66093989078eF86faa30
Contract address: 0xF528bCa958Da0E7Ab35f77a7561B55519Fbcec68
Token address: 0x000000000000000000000000000000000072422b

Generated random EVM address: 0x5598a29B052d23E74Da68C53B5c87799121434B7

--- Step 1: Minting 10 tokens to treasury ---
Mint tx hash: 0x43e60c37cd19a7b96a832e653bafc6246835c64a71bf33794a279dc6c02c19b3
New total supply: 1000010

--- Step 2: Transferring 10 tokens to random address ---
Transfer tx hash: 0xb3d3433ef1af4965289d27d1b90cd28b3c724c74cc11d3b8fbb2fc4a9b4ec00c
✅ Transfer successful!
Response code: 22
```

## Key Takeaways

1. **HTS tokens support unlimited auto-associations** when accounts are auto-created
2. **Three different transfer methods** provide flexibility for different use cases
3. **Works seamlessly with EVM addresses** - no need for Hedera account IDs
4. **Dual interface** - interact via SDK or smart contracts
5. **Automatic account creation** handles onboarding new users transparently

## Resources

- [Hedera Documentation](https://docs.hedera.com/)
- [HTS System Contracts](https://github.com/hashgraph/hedera-smart-contracts)
- [Hedera JSON-RPC Relay](https://github.com/hiero-ledger/hiero-json-rpc-relay)
- [HashScan Explorer](https://hashscan.io/testnet)
