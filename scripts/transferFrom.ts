import { network } from "hardhat";
import { EventLog, Log } from "ethers";
import { config } from "./config.js";

/**
 * Test: Mint new tokens to treasury, then transfer using transferFromPublic
 *
 * transferFromPublic is the ERC20-style transferFrom.
 * It requires the owner to first approve the spender.
 *
 * Flow:
 * 1. Mint tokens to treasury (contract)
 * 2. Approve the contract to spend its own tokens (or approve deployer)
 * 3. Use transferFromPublic to move tokens
 */
async function main() {
  const { ethers } = await network.connect({ network: "testnet" });
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Test: Mint & Transfer using transferFromPublic");
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
    [],
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

  // Step 2: Approve the contract to spend tokens
  const approveAmount = BigInt(10);
  console.log(
    `\n--- Step 2: Approving ${approveAmount} tokens for spending ---`
  );

  try {
    const approveTx = await contract.approvePublic(
      config.fungibleTokenAddress,
      config.htsContractAddress, // spender is the contract itself
      approveAmount,
      {
        gasLimit: 800_000
      }
    );
    await approveTx.wait();
    console.log("Approve tx hash:", approveTx.hash);
    console.log("✅ Approval successful!");
  } catch (error: unknown) {
    console.log("⚠️ Approval may have failed");
    if (error instanceof Error) {
      console.log("Error:", error.message);
    }
  }

  // Step 3: Transfer using transferFromPublic
  const transferAmount = BigInt(10);
  console.log(
    `\n--- Step 3: Transferring ${transferAmount} tokens using transferFromPublic ---`
  );
  console.log("From (treasury):", config.htsContractAddress);
  console.log("To (receiver):", randomAddress);

  try {
    const transferFromTx = await contract.transferFromPublic(
      config.fungibleTokenAddress,
      config.htsContractAddress, // from treasury
      randomAddress, // to receiver
      transferAmount,
      {
        gasLimit: 2_000_000
      }
    );
    const receipt = await transferFromTx.wait();
    console.log("TransferFrom tx hash:", transferFromTx.hash);
    console.log("✅ transferFromPublic successful!");

    // Check ResponseCode event
    const responseEvent = receipt?.logs.find((log: EventLog | Log) => {
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
    console.log("❌ transferFromPublic failed!");
    if (error instanceof Error) {
      console.log("Error:", error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
