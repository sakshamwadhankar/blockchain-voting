const hre = require("hardhat");

async function main() {
    const provider = hre.ethers.provider;

    console.log("🔍 Checking Node Status...");

    // 1. Get Chain ID
    const network = await provider.getNetwork();
    console.log(`✅ Chain ID: ${network.chainId}`);

    // 2. Get Accounts
    const accounts = await hre.ethers.getSigners();
    const account0 = accounts[0];
    const account1 = accounts[1];

    // 3. Get Balances
    const balance0 = await provider.getBalance(account0.address);
    const balance1 = await provider.getBalance(account1.address);

    console.log(`\n💰 Account #0 (${account0.address}):`);
    console.log(`   Balance: ${hre.ethers.formatEther(balance0)} ETH`);

    console.log(`\n💰 Account #1 (${account1.address}):`);
    console.log(`   Balance: ${hre.ethers.formatEther(balance1)} ETH`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
