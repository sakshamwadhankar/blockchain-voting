# 🔧 Troubleshooting Guide

## Common Issues and Solutions

---

## ❌ "Failed to connect to blockchain"

### Cause
The ElectionManager contract hasn't been deployed, or the deployment file is missing.

### Solution

**Step 1: Check if Hardhat node is running**
```bash
# You should see it in a terminal window
# If not, start it:
npx hardhat node
```

**Step 2: Deploy the ElectionManager contract**
```bash
npx hardhat run scripts/deploy-election.js --network localhost
```

**Step 3: Verify deployment file exists**
Check that these files exist:
- `deployments/election-localhost.json`
- `frontend/public/deployments/election-localhost.json`

**Step 4: Refresh the browser**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Quick Fix Command
```bash
# Run all steps at once (in a new terminal)
npx hardhat run scripts/deploy-election.js --network localhost
```

---

## ❌ "Cannot connect to the network localhost"

### Cause
Hardhat node is not running.

### Solution
```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Keep this terminal running!
```

---

## ❌ "Transaction failed" or "Insufficient funds"

### Cause
MetaMask account doesn't have ETH or wrong network.

### Solution

**Step 1: Check MetaMask network**
- Network Name: Hardhat Local
- RPC URL: http://127.0.0.1:8545
- Chain ID: 31337
- Currency: ETH

**Step 2: Import test account**
1. Copy private key from Hardhat node terminal
2. MetaMask → Import Account → Paste private key
3. You should see 10,000 ETH

**Step 3: Reset account (if needed)**
- MetaMask → Settings → Advanced → Reset Account

---

## ❌ "Already voted in this election"

### Cause
The Corporate ID has already been used to vote.

### Solution
Use a different Corporate ID:
- CORP-001, CORP-002, CORP-003, etc.
- Or switch to a different MetaMask account

---

## ❌ "Invalid voter token"

### Cause
Token hasn't been issued or is incorrect format.

### Solution

**For Testing:**
Use this test token:
```
0x1234567890123456789012345678901234567890123456789012345678901234
```

**For Production:**
1. Click "Request Voter Token"
2. Wait for transaction to confirm
3. Use the token returned from the contract

---

## ❌ Frontend shows blank page

### Cause
Build error or missing dependencies.

### Solution
```bash
cd frontend
npm install
npm run dev
```

---

## ❌ Backend not responding

### Cause
Backend server not running or wrong port.

### Solution
```bash
cd backend
npm install
npm start

# Should see: Server running on http://localhost:5000
```

---

## ❌ Charts not displaying

### Cause
Recharts library not installed.

### Solution
```bash
cd frontend
npm install recharts
```

---

## ❌ "Cannot add candidates after election starts"

### Cause
~~Old version: Elections started immediately, preventing candidate addition.~~
**FIXED**: Now you can add candidates anytime before the election ends.

### Solution
The contract has been updated. You can now:
- Add candidates even after the election starts
- Add candidates anytime before the election ends
- No more timing issues!

**If you still see this error:**
1. Redeploy the contract:
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy-election.js --network localhost
   ```
2. Refresh browser (Ctrl+Shift+R)

---

## ❌ "Cannot add candidates after election ends"

### Cause
The election has already ended.

### Solution
Create a new election with a longer duration.

---

## ❌ MetaMask not connecting

### Cause
MetaMask not installed or locked.

### Solution
1. Install MetaMask browser extension
2. Unlock MetaMask
3. Refresh the page
4. Click "Connect Wallet"

---

## 🔄 Complete Reset (Nuclear Option)

If nothing works, do a complete reset:

```bash
# 1. Stop all processes
# Press Ctrl+C in all terminal windows

# 2. Clean everything
rm -rf node_modules frontend/node_modules backend/node_modules
rm -rf artifacts cache deployments/election-localhost.json
rm -rf frontend/public/deployments

# 3. Reinstall
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 4. Start fresh
# Terminal 1
npx hardhat node

# Terminal 2
npx hardhat run scripts/deploy-election.js --network localhost

# Terminal 3
cd frontend && npm run dev

# Terminal 4
cd backend && npm start

# 5. Reset MetaMask
# MetaMask → Settings → Advanced → Reset Account

# 6. Refresh browser
# Hard refresh: Ctrl+Shift+R
```

---

## 📋 Startup Checklist

Use this checklist every time you start the system:

- [ ] Terminal 1: `npx hardhat node` (running)
- [ ] Terminal 2: Deploy contracts
  ```bash
  npx hardhat run scripts/deploy-election.js --network localhost
  ```
- [ ] Terminal 3: `cd frontend && npm run dev` (running)
- [ ] Terminal 4: `cd backend && npm start` (running)
- [ ] MetaMask: Connected to Hardhat Local (Chain ID: 31337)
- [ ] MetaMask: Account imported with ETH
- [ ] Browser: http://localhost:5173 loaded
- [ ] Check: No console errors (F12)

---

## 🔍 Debugging Tips

### Check Console Logs
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages

### Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Check if deployment file loads:
   - Look for `election-localhost.json`
   - Should return 200 status

### Check Hardhat Node
1. Look at Hardhat node terminal
2. Should see transactions when you interact
3. If no activity, check MetaMask connection

### Check Contract Address
```bash
# View deployment info
cat deployments/election-localhost.json

# Should show:
# {
#   "electionManager": "0x5FbDB...",
#   "deployer": "0xf39F...",
#   ...
# }
```

---

## 🆘 Still Having Issues?

### Check These Files Exist
```
✓ contracts/core/ElectionManager.sol
✓ scripts/deploy-election.js
✓ deployments/election-localhost.json
✓ frontend/public/deployments/election-localhost.json
✓ frontend/src/services/electionService.js
✓ frontend/src/pages/ElectionAdmin.jsx
```

### Verify Ports
```bash
# Check if ports are in use
netstat -ano | findstr :8545  # Hardhat node
netstat -ano | findstr :5173  # Frontend
netstat -ano | findstr :5000  # Backend
```

### Check Node Version
```bash
node --version
# Should be v18 or higher
```

---

## 📞 Quick Commands Reference

```bash
# Start Hardhat node
npx hardhat node

# Deploy ElectionManager
npx hardhat run scripts/deploy-election.js --network localhost

# Start frontend
cd frontend && npm run dev

# Start backend
cd backend && npm start

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Check deployment
cat deployments/election-localhost.json
```

---

## 🎯 Most Common Issue: Deployment File Missing

**90% of "Failed to connect to blockchain" errors are because:**

1. Hardhat node not running
2. Contract not deployed
3. Deployment file not in `frontend/public/deployments/`

**Quick Fix:**
```bash
# Make sure Hardhat node is running in another terminal
npx hardhat run scripts/deploy-election.js --network localhost

# Refresh browser
# Ctrl+Shift+R
```

---

**If you're still stuck, check the console logs in the browser (F12) for specific error messages!**
