import { ethers } from "hardhat";
import hre from "hardhat";
import fs from "fs";

async function main() {
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const network = hre.network.name;

    console.log("=".repeat(60));
    console.log(`Deployer:  ${deployer.address}`);
    console.log(`Balance:   ${ethers.formatEther(balance)} ETH`);
    console.log(`Network:   ${network}`);
    console.log("=".repeat(60));

    // ---------- 1. Deploy MyERC20 (Ballot Token) ----------
    const erc20Factory = await ethers.getContractFactory("MyERC20");
    const erc20 = await erc20Factory.deploy(
        "BallotToken",
        "VOTE",
        ethers.parseEther("1000000"),   // initial supply
        ethers.parseEther("10000000"),  // max supply
        deployer.address
    );
    await erc20.waitForDeployment();
    const erc20Addr = await erc20.getAddress();
    console.log(`✅ MyERC20 (BallotToken) deployed to: ${erc20Addr}`);

    // ---------- 2. Deploy Vault (Treasury) ----------
    const vaultFactory = await ethers.getContractFactory("Vault");
    const vault = await vaultFactory.deploy(deployer.address);
    await vault.waitForDeployment();
    const vaultAddr = await vault.getAddress();
    console.log(`✅ Vault deployed to: ${vaultAddr}`);

    // ---------- 3. Deploy Governance ----------
    const govFactory = await ethers.getContractFactory("Governance");
    const governance = await govFactory.deploy(
        erc20Addr,
        259200,                         // 3-day voting period
        4,                              // 4% quorum
        ethers.parseEther("100"),       // proposal threshold
        deployer.address
    );
    await governance.waitForDeployment();
    const govAddr = await governance.getAddress();
    console.log(`✅ Governance deployed to: ${govAddr}`);

    // ---------- 4. Post-Deploy Wiring ----------
    console.log("\n🔗 Wiring contracts...");

    // Vault → allow Governance to call releaseETH
    const setGovTx = await vault.setGovernance(govAddr);
    await setGovTx.wait();
    console.log(`   Vault.setGovernance(${govAddr}) ✅`);

    // Governance → link to Vault
    const setVaultTx = await governance.setVault(vaultAddr);
    await setVaultTx.wait();
    console.log(`   Governance.setVault(${vaultAddr}) ✅`);

    // ---------- 5. Save Deployment Addresses ----------
    const out = {
        MyERC20: erc20Addr,
        Vault: vaultAddr,
        Governance: govAddr,
        deployer: deployer.address,
        network: network,
        timestamp: new Date().toISOString(),
    };

    fs.mkdirSync("./deployments", { recursive: true });
    const filePath = `./deployments/${network}.json`;
    fs.writeFileSync(filePath, JSON.stringify(out, null, 2));

    console.log("=".repeat(60));
    console.log(`📄 Deployment addresses saved to ${filePath}`);
    console.log("=".repeat(60));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
