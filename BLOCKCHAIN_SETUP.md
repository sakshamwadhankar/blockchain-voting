# Blockchain Setup Guide

## The Problem

You're seeing this error:
```
Failed to load elections: Error: could not decode result data (value="0x", info={ "method": "nextElectionId" })
```

This means the smart contract isn't deployed or the blockchain node isn't running.

## Solution: Start Local Blockchain & Deploy Contract

### Step 1: Start Hardhat Node

Open a terminal and run:
```bash
npx hardhat node
```

This starts a local Ethereum blockchain on `http://127.0.0.1:8545/`

Keep this terminal running - don't close it!

### Step 2: Deploy the ElectionManager Contract

Open a NEW terminal and run:
```bash
npx hardhat run scripts/deploy-election.js --network localhost
```

You should see:
```
✅ ElectionManager deployed to: 0x610178dA211FEF7D417bC0e6FeD39F05609AD788
```

### Step 3: Configure MetaMask

1. Open MetaMask
2. Click the network dropdown (top left)
3. Click "Add Network" → "Add a network manually"
4. Enter these details:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
5. Click "Save"

### Step 4: Import Test Account

Hardhat provides test accounts with ETH. Import one:

1. In MetaMask, click the account icon → "Import Account"
2. Paste this private key (from Hardhat's default accounts):
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
3. This account has 10,000 test ETH

### Step 5: Refresh Your App

Now reload your frontend application. The elections should load!

## Troubleshooting

### "Failed to load elections" still appears

1. Check Hardhat node is running (Step 1)
2. Verify contract is deployed (Step 2)
3. Ensure MetaMask is connected to "Hardhat Local" network
4. Check the contract address in `frontend/src/config/contracts.js` matches the deployed address

### "User rejected the request"

Click "Connect" in MetaMask when prompted.

### Contract address mismatch

If you redeploy, update the address in:
- `frontend/src/config/contracts.js` (GOVERNANCE_ADDRESS)
- `deployments/election-localhost.json`

## Quick Test

After setup, you can test the system:

```bash
npx hardhat run scripts/test-election-system.js --network localhost
```

This creates a sample election with candidates and test votes.
