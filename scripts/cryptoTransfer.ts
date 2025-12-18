import { network } from "hardhat";
import { EventLog, Log } from "ethers";
import { config } from "./config.js";

/**
 * Test: Mint new tokens to treasury, then transfer using cryptoTransferPublic
 *
 * cryptoTransferPublic is the most flexible transfer method - it can handle
 * multiple token transfers and HBAR transfers in a single atomic transaction.
 */
async function main() {
  const { ethers } = await network.connect({ network: "testnet" });
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Test: Mint & Transfer using cryptoTransferPublic");
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

  // Step 2: Transfer using cryptoTransferPublic
  const transferAmount = BigInt(10);
  console.log(
    `\n--- Step 2: Transferring ${transferAmount} tokens using cryptoTransferPublic ---`
  );

  // Build the transfer list structure
  // TransferList is for HBAR transfers (empty in this case)
  const transferList = {
    transfers: [] // No HBAR transfers
  };

  // TokenTransferList is for token transfers
  const tokenTransferList = [
    {
      token: config.fungibleTokenAddress,
      transfers: [
        {
          accountID: config.htsContractAddress, // sender (treasury)
          amount: -transferAmount, // negative = sending
          isApproval: false
        },
        {
          accountID: randomAddress, // receiver
          amount: transferAmount, // positive = receiving
          isApproval: false
        }
      ],
      nftTransfers: [] // No NFT transfers
    }
  ];

  try {
    const cryptoTransferTx = await contract.cryptoTransferPublic(
      transferList,
      tokenTransferList,
      {
        gasLimit: 1_500_000
      }
    );
    const receipt = await cryptoTransferTx.wait();
    console.log("CryptoTransfer tx hash:", cryptoTransferTx.hash);
    console.log("✅ cryptoTransferPublic successful!");

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
    console.log("❌ cryptoTransferPublic failed!");
    if (error instanceof Error) {
      console.log("Error:", error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
