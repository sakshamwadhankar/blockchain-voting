const { ethers } = require("hardhat");
require("dotenv").config({ path: "backend/.env" });

async function main() {
    console.log("🔍 Starting OTP Verification Simulation...");

    // 1. Load Configuration
    const ELECTION_MANAGER_ADDRESS = process.env.ELECTION_MANAGER_ADDRESS;
    console.log("📍 Election Manager Address:", ELECTION_MANAGER_ADDRESS);

    if (!ELECTION_MANAGER_ADDRESS) {
        console.error("❌ ELECTION_MANAGER_ADDRESS is missing in backend/.env");
        return;
    }

    // 2. Setup Provider and Wallet
    // Using localhost provider as per backend config
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    // Get the first signer (owner)
    const [owner] = await ethers.getSigners();
    console.log("👤 Backend Wallet (Owner):", owner.address);

    // 3. Connect to Contract
    const ElectionManager = await ethers.getContractAt("ElectionManager", ELECTION_MANAGER_ADDRESS, owner); // Use ABI from artifacts

    // Verify connection code
    const code = await provider.getCode(ELECTION_MANAGER_ADDRESS);
    if (code === "0x") {
        console.error("❌ No contract found at ELECTION_MANAGER_ADDRESS!");
        return;
    }
    console.log("✅ Contract found on-chain.");

    // 4. Test Parameters
    const employeeId = "MNC-001"; // Using valid ID
    const otpCode = "123456";

    console.log(`\n🔄 Attempting issueVoterToken('${employeeId}', '${otpCode}')...`);

    // 5. Simulate Transaction (Static Call)
    try {
        const voterToken = await ElectionManager.issueVoterToken.staticCall(employeeId, otpCode);
        console.log("✅ Static Call Successful! Token:", voterToken);
    } catch (error) {
        console.error("\n❌ Static Call FAILED:");
        if (error.reason) console.error("   Reason:", error.reason);
        else console.error("   Error:", error);

        // If static call fails, we stop here usually, but let's try to send tx to see if we get more info? 
        // Actually static call failure is the main indicator.
        return;
    }

    // 6. Execute Transaction
    try {
        const tx = await ElectionManager.issueVoterToken(employeeId, otpCode);
        console.log("✅ Transaction Sent! Hash:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        const receipt = await tx.wait();
        console.log("✅ Transaction Confirmed in block:", receipt.blockNumber);
    } catch (error) {
        console.error("\n❌ Transaction FAILED:");
        if (error.reason) console.error("   Reason:", error.reason);
        else console.error("   Error:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
