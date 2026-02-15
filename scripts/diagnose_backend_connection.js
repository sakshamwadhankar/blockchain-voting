const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });

async function diagnose() {
    console.log("🔍 Starting Backend Connection Diagnosis...");

    // 1. Load Environment Variables
    const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
    const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
    const ELECTION_MANAGER_ADDRESS = process.env.ELECTION_MANAGER_ADDRESS;

    console.log(`\n📂 Environment Config:`);
    console.log(`   RPC_URL: ${RPC_URL}`);
    console.log(`   ELECTION_MANAGER_ADDRESS: ${ELECTION_MANAGER_ADDRESS}`);
    console.log(`   ADMIN_PRIVATE_KEY: ${PRIVATE_KEY ? "Set (Hidden)" : "❌ NOT SET"}`);

    if (!PRIVATE_KEY || !ELECTION_MANAGER_ADDRESS) {
        console.error("❌ Critical: Missing environment variables.");
        process.exit(1);
    }

    // 2. Connect to Provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    try {
        const network = await provider.getNetwork();
        console.log(`\n✅ Connected to Network: ${network.name} (Chain ID: ${network.chainId})`);
    } catch (error) {
        console.error("❌ Failed to connect to RPC provider:", error.message);
        process.exit(1);
    }

    // 3. Check Admin Wallet
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`\n👤 Admin Wallet Address: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

    // 4. Check Contract Code
    const code = await provider.getCode(ELECTION_MANAGER_ADDRESS);
    if (code === "0x") {
        console.error("❌ Critical: No contract found at ELECTION_MANAGER_ADDRESS. Check deployment.");
        process.exit(1);
    } else {
        console.log("✅ Contract code found at address.");
    }

    // 5. Check Contract Ownership
    const abi = ["function owner() view returns (address)"];
    const contract = new ethers.Contract(ELECTION_MANAGER_ADDRESS, abi, provider);

    try {
        const owner = await contract.owner();
        console.log(`\n👑 Contract Owner: ${owner}`);

        if (owner.toLowerCase() === wallet.address.toLowerCase()) {
            console.log("✅ SUCCESS: Backend wallet IS the owner.");
        } else {
            console.error("❌ FAILURE: Backend wallet is NOT the owner.");
            console.error(`   Expected: ${owner}`);
            console.error(`   Actual:   ${wallet.address}`);
            console.error("   → Update ADMIN_PRIVATE_KEY in backend/.env to the owner's key.");
        }
    } catch (error) {
        console.error("❌ Failed to fetch contract owner:", error.message);
        console.log("   (The contract might not implement 'owner()' or is not 'Ownable')");
    }

    console.log("\n Diagnosis complete.");
}

diagnose().catch(console.error);
