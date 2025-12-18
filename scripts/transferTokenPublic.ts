import { network } from "hardhat";
import { EventLog, Log } from "ethers";
import { config } from "./config.js";

/**
 * Test: Mint new tokens then transfer to a random EVM address
 * that doesn't yet have a Hedera account ID.
 */
async function main() {
  const { ethers } = await network.connect({ network: "testnet" });
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Test: Mint & Transfer to Random EVM Address");
  console.log("=".repeat(60));

  // Validate config
  if (!config.htsContractAddress || !config.fungibleTokenAddress) {
    throw new Error(
      "Contract or token address not set in config.ts. Please run deploy.ts and createHTSToken.ts first."
    );
  }

  console.log("Using account:", deployer.address);
  console.log("Contract address:", config.htsContractAddress);
  console.log("Token address:", config.fungibleTokenAddress);

  // Get contract instance
  const contract = await ethers.getContractAt(
    "CreateAndManageHTSTokens",
    config.htsContractAddress,
    deployer
  );

  // Generate a random EVM address (no Hedera account yet)
  const randomWallet = ethers.Wallet.createRandom();
  const randomAddress = randomWallet.address;
  console.log("\nGenerated random EVM address:", randomAddress);

  // Step 1: Mint tokens to the contract (treasury)
  const mintAmount = BigInt(10);
  console.log(`\n--- Step 1: Minting ${mintAmount} tokens to treasury ---`);

  const mintTx = await contract.mintTokenPublic(
    config.fungibleTokenAddress,
    mintAmount,
    [], // empty metadata for fungible tokens
    {
      gasLimit: 75_000
    }
  );
  const mintReceipt = await mintTx.wait();
  console.log("Mint tx hash:", mintTx.hash);

  // Check for MintedToken event
  const mintEvent = mintReceipt?.logs.find((log: EventLog | Log) => {
    if (log instanceof EventLog) {
      return log.fragment?.name === "MintedToken";
    }
    return false;
  }) as EventLog | undefined;

  if (mintEvent) {
    console.log(
      "New total supply:",
      mintEvent.args?.newTotalSupply?.toString()
    );
  }

  // Step 2: Transfer tokens to the random address using transferTokenPublic
  const transferAmount = BigInt(10);
  console.log(
    `\n--- Step 2: Transferring ${transferAmount} tokens to random address ---`
  );
  console.log("From (treasury):", config.htsContractAddress);
  console.log("To (random):", randomAddress);

  try {
    const transferTx = await contract.transferTokenPublic(
      config.fungibleTokenAddress,
      config.htsContractAddress, // from treasury (contract)
      randomAddress, // to random address
      transferAmount,
      {
        gasLimit: 1_500_000
      }
    );
    const transferReceipt = await transferTx.wait();
    console.log("Transfer tx hash:", transferTx.hash);
    console.log("✅ Transfer successful!");

    // Check ResponseCode event
    const responseEvent = transferReceipt?.logs.find((log: EventLog | Log) => {
      if (log instanceof EventLog) {
        return log.fragment?.name === "ResponseCode";
      }
      return false;
    }) as EventLog | undefined;

    if (responseEvent) {
      console.log(
        "Response code:",
        responseEvent.args?.responseCode?.toString()
      );
    }
  } catch (error: unknown) {
    console.log("❌ Transfer failed!");
    if (error instanceof Error) {
      console.log("Error:", error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
