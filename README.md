# Deploy the contract (only once)
npx hardhat run scripts/deploy.ts

# Copy the contract address and update config.ts
# htsContractAddress: "0x..."

# Create tokens as needed
npx hardhat run scripts/createHTSToken.ts

# Step 4: Copy the fungible token address and update config.ts
# fungibleTokenAddress = "0x..."

# Make sure config.ts has both addresses set first!
npx hardhat run scripts/transferTokenPublic.ts
npx hardhat run scripts/cryptoTransfer.ts
npx hardhat run scripts/transferFrom.ts
