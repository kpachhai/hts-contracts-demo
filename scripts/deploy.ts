import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect({ network: "testnet" });
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(50));
  console.log("Deploying CreateAndManageHTSTokens contract");
  console.log("=".repeat(50));
  console.log("Deployer account:", deployer.address);

  // Deploy the CreateAndManageHTSTokens wrapper
  const CreateAndManageHTSTokens = await ethers.getContractFactory(
    "CreateAndManageHTSTokens",
    deployer
  );
  const contract = await CreateAndManageHTSTokens.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("\n--- Deployment Complete ---");
  console.log("HTSContract deployed at:", contractAddress);
  console.log("\n⚠️  IMPORTANT: Update scripts/config.ts with:");
  console.log(`   htsContractAddress: "${contractAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
