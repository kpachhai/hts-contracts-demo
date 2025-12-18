import { network } from "hardhat";
import { EventLog, Log } from "ethers";
import { config } from "./config.js";

async function main() {
  const { ethers } = await network.connect({ network: "testnet" });
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(50));
  console.log("Creating HTS Fungible Token");
  console.log("=".repeat(50));

  // Validate contract address
  if (!config.htsContractAddress) {
    throw new Error(
      "CreateAndManageHTSTokens address not set in config.ts. Please run deploy.ts first."
    );
  }

  console.log("Using account:", deployer.address);
  console.log("CreateAndManageHTSTokens address:", config.htsContractAddress);

  // Get the deployed contract instance
  const contract = await ethers.getContractAt(
    "CreateAndManageHTSTokens",
    config.htsContractAddress,
    deployer
  );

  // Token parameters - customize these as needed
  const TOKEN_NAME = config.defaultTokenParams.name;
  const TOKEN_SYMBOL = config.defaultTokenParams.symbol;
  const TOKEN_MEMO = config.defaultTokenParams.memo;
  const INITIAL_SUPPLY = BigInt(config.defaultTokenParams.initialSupply);
  const MAX_SUPPLY = BigInt(config.defaultTokenParams.maxSupply);
  const DECIMALS = config.defaultTokenParams.decimals;
  const FREEZE_DEFAULT = config.defaultTokenParams.freezeDefault;
  const TREASURY = config.htsContractAddress; // Contract as treasury
  const HBAR_TO_SEND = config.defaultTokenParams.hbarToSend;

  // Token keys - set admin and supply keys to contract address
  // Key types from KeyHelper.sol:
  // ADMIN = 1, KYC = 2, FREEZE = 4, WIPE = 8, SUPPLY = 16, FEE = 32, PAUSE = 64
  const keys = [
    {
      keyType: 1, // ADMIN key
      key: {
        inheritAccountKey: false,
        contractId: config.htsContractAddress,
        ed25519: "0x",
        ECDSA_secp256k1: "0x",
        delegatableContractId: "0x0000000000000000000000000000000000000000"
      }
    },
    {
      keyType: 16, // SUPPLY key
      key: {
        inheritAccountKey: false,
        contractId: config.htsContractAddress,
        ed25519: "0x",
        ECDSA_secp256k1: "0x",
        delegatableContractId: "0x0000000000000000000000000000000000000000"
      }
    }
  ];

  console.log("\n--- Token Parameters ---");
  console.log(`  Name: ${TOKEN_NAME}`);
  console.log(`  Symbol: ${TOKEN_SYMBOL}`);
  console.log(`  Memo: ${TOKEN_MEMO}`);
  console.log(`  Initial Supply: ${INITIAL_SUPPLY}`);
  console.log(`  Max Supply: ${MAX_SUPPLY}`);
  console.log(`  Decimals: ${DECIMALS}`);
  console.log(`  Treasury: ${TREASURY}`);
  console.log(`  HBAR to send: ${HBAR_TO_SEND}`);

  console.log("\nCreating token...");

  const createTx = await contract.createFungibleTokenPublic(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_MEMO,
    INITIAL_SUPPLY,
    MAX_SUPPLY,
    DECIMALS,
    FREEZE_DEFAULT,
    TREASURY,
    keys,
    {
      gasLimit: 200_000,
      value: ethers.parseEther(HBAR_TO_SEND)
    }
  );

  const receipt = await createTx.wait();
  console.log("Transaction hash:", createTx.hash);

  // Parse the CreatedToken event to get the token address
  let tokenAddress: string | undefined;

  const createdTokenEvent = receipt?.logs.find((log: EventLog | Log) => {
    if (log instanceof EventLog) {
      return log.fragment?.name === "CreatedToken";
    }
    return false;
  }) as EventLog | undefined;

  if (createdTokenEvent) {
    tokenAddress = createdTokenEvent.args?.tokenAddress;
  }

  console.log("\n--- Token Creation Complete ---");
  if (tokenAddress) {
    console.log("Token Address:", tokenAddress);
    console.log("\n⚠️  IMPORTANT: Update scripts/config.ts with:");
    console.log(`   fungibleTokenAddress: "${tokenAddress}"`);
  } else {
    console.log(
      "CreatedToken event not found. Check transaction on HashScan:",
      createTx.hash
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
