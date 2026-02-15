const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ElectionManager Contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // Deploy ElectionManager
  const ElectionManager = await hre.ethers.getContractFactory("ElectionManager");
  const electionManager = await ElectionManager.deploy(deployer.address);
  await electionManager.waitForDeployment();

  const electionAddress = await electionManager.getAddress();
  console.log("✅ ElectionManager deployed to:", electionAddress);

  // Save deployment info
  const fs = require("fs");
  const path = require("path");
  
  const deploymentInfo = {
    electionManager: electionAddress,
    deployer: deployer.address,
    network: hre.network.name,
    timestamp: new Date().toISOString()
  };

  // Save to deployments folder
  fs.writeFileSync(
    "deployments/election-localhost.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Also save to frontend public folder for easy access
  const publicDeploymentsDir = path.join("frontend", "public", "deployments");
  if (!fs.existsSync(publicDeploymentsDir)) {
    fs.mkdirSync(publicDeploymentsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(publicDeploymentsDir, "election-localhost.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📝 Deployment info saved to:");
  console.log("   - deployments/election-localhost.json");
  console.log("   - frontend/public/deployments/election-localhost.json");
  console.log("\n🎉 Deployment Complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
