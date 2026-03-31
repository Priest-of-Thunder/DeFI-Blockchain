import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // 1. Deploy ERC-20 Tokens
  const Token = await hre.ethers.getContractFactory("Token");
  
  const tokenA = await Token.deploy("Token A", "TKNA", 1000000);
  await tokenA.waitForDeployment();
  console.log(`TokenA deployed to: ${tokenA.target}`);

  const tokenB = await Token.deploy("Token B", "TKNB", 1000000);
  await tokenB.waitForDeployment();
  console.log(`TokenB deployed to: ${tokenB.target}`);

  // 2. Deploy Two DEX Instances
  const DEX = await hre.ethers.getContractFactory("DEX");
  
  const dex1 = await DEX.deploy(tokenA.target, tokenB.target);
  await dex1.waitForDeployment();
  console.log(`DEX 1 deployed to: ${dex1.target}`);

  const dex2 = await DEX.deploy(tokenA.target, tokenB.target);
  await dex2.waitForDeployment();
  console.log(`DEX 2 deployed to: ${dex2.target}`);

  // Fetch and log the LP Token addresses automatically minted by the DEX constructors
  const lpToken1 = await dex1.lpToken();
  const lpToken2 = await dex2.lpToken();
  console.log(`DEX 1 LPToken is located at: ${lpToken1}`);
  console.log(`DEX 2 LPToken is located at: ${lpToken2}`);

  // 3. Deploy Arbitrage Contract
  const Arbitrage = await hre.ethers.getContractFactory("Arbitrage");
  const arbitrage = await Arbitrage.deploy();
  await arbitrage.waitForDeployment();
  console.log(`Arbitrage Contract deployed to: ${arbitrage.target}`);

  console.log("\n✅ Deployment Complete!");
  console.log("Make sure to copy these addresses into your README.md and UI configuration.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});