// Configuration file for deployed contract addresses
// Update this after running deploy.ts

export const config = {
  // HTSContract deployed address - update after deployment
  htsContractAddress: "0xF528bCa958Da0E7Ab35f77a7561B55519Fbcec68",

  // Created token addresses - update after creating tokens
  fungibleTokenAddress: "0x000000000000000000000000000000000072422b",

  // Default token parameters
  defaultTokenParams: {
    name: "MyFungibleToken",
    symbol: "MFT",
    memo: "My HTS fungible token",
    initialSupply: 1000000n,
    maxSupply: 10000000n,
    decimals: 0,
    freezeDefault: false,
    hbarToSend: "10"
  }
};
