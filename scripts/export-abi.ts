import fs from "fs";
import path from "path";

/**
 * Export ABIs and deployment addresses into frontend/contracts/
 * Run after deployment:  npx hardhat run scripts/export-abi.ts
 */

const CONTRACTS = ["Governance", "Vault", "MyERC20"];
const OUTPUT_DIR = path.resolve(__dirname, "..", "frontend", "contracts");

async function main() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // --- Export ABIs ---
    for (const name of CONTRACTS) {
        const artifactPath = path.resolve(
            __dirname, "..", "artifacts", "contracts",
            name === "MyERC20" ? "tokens" : "core",
            `${name}.sol`, `${name}.json`
        );

        if (!fs.existsSync(artifactPath)) {
            console.warn(`⚠️  Artifact not found for ${name}, skipping. Run 'npx hardhat compile' first.`);
            continue;
        }

        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
        const abiOnly = { contractName: name, abi: artifact.abi };

        const outFile = path.join(OUTPUT_DIR, `${name}.json`);
        fs.writeFileSync(outFile, JSON.stringify(abiOnly, null, 2));
        console.log(`✅ ABI exported: ${outFile}`);
    }

    // --- Export Addresses ---
    const deploymentsDir = path.resolve(__dirname, "..", "deployments");
    if (fs.existsSync(deploymentsDir)) {
        const files = fs.readdirSync(deploymentsDir).filter(f => f.endsWith(".json"));
        for (const file of files) {
            const src = path.join(deploymentsDir, file);
            const dest = path.join(OUTPUT_DIR, `addresses-${file}`);
            fs.copyFileSync(src, dest);
            console.log(`✅ Addresses exported: ${dest}`);
        }
    } else {
        console.warn("⚠️  No deployments/ folder found. Deploy first, then export.");
    }

    console.log("\n📦 All exports saved to:", OUTPUT_DIR);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
