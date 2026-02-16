# KWOTE - Quick Setup Guide

This guide will help you get KWOTE up and running in minutes.

## 🚀 Quick Start (5 Minutes)

### Step 1: Prerequisites Check

Make sure you have these installed:

```bash
node --version    # Should be v18 or higher
npm --version     # Should be 9 or higher
git --version     # Any recent version
```

If not installed, download from:
- Node.js: https://nodejs.org/
- Git: https://git-scm.com/

### Step 2: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/kwote.git
cd kwote

# Install all dependencies (this may take 2-3 minutes)
npm install
cd katana-react && npm install && cd ..
cd backend && npm install && cd ..
```

### Step 3: Configure Environment

```bash
# Copy environment templates
cp .env.example .env
cp katana-react/.env.example katana-react/.env
cp backend/.env.example backend/.env
```

**Important**: For local development, the default values in `.env.example` files work out of the box. You only need to configure Firebase credentials.

### Step 4: Firebase Setup (5 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Add Project" or use existing project
3. Enter project name (e.g., "kwote-voting")
4. Disable Google Analytics (optional)
5. Click "Create Project"

Once created:

6. Click "Build" → "Firestore Database" → "Create Database"
7. Choose "Start in test mode" → Select location → Enable
8. Click "Build" → "Storage" → "Get Started" → "Start in test mode" → Done
9. Click the gear icon ⚙️ → "Project Settings"
10. Scroll down to "Your apps" → Click web icon `</>`
11. Register app with nickname "kwote-web"
12. Copy the `firebaseConfig` values

Update `katana-react/.env`:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Step 5: Install MetaMask

1. Install MetaMask browser extension: https://metamask.io/
2. Create a new wallet or import existing
3. Add Hardhat Local Network:
   - Click MetaMask → Networks → Add Network → Add Manually
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
   - Save

### Step 6: Start the Application

Open 4 separate terminal windows:

**Terminal 1 - Blockchain Node:**
```bash
npx hardhat node
```
Keep this running. You'll see 20 test accounts with 10000 ETH each.

**Terminal 2 - Deploy Contracts:**
```bash
npx hardhat run scripts/deploy-election.js --network localhost
```
This deploys the smart contract. You should see:
```
✅ ElectionManager deployed to: 0x5FbDB...
```

**Terminal 3 - Backend Server:**
```bash
cd backend
npm start
```
You should see: `Server running on port 5000`

**Terminal 4 - Frontend:**
```bash
cd katana-react
npm run dev
```
You should see: `Local: http://localhost:5174/`

### Step 7: Import Test Account to MetaMask

From Terminal 1 (Hardhat node), copy one of the private keys:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

In MetaMask:
1. Click account icon → Import Account
2. Paste the private key
3. Click Import

### Step 8: Access the Application

Open your browser to: http://localhost:5174

You should see the KWOTE landing page with 3D animations!

---

## 🎯 First Time Usage

### Create Your First Election (Admin)

1. Click "Cast Your Vote" button
2. Click "Login as Admin"
3. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
4. Click "Create Election" tab
5. Fill in:
   - Position: `CEO`
   - Duration: `7` days
   - Description: `Election for Chief Executive Officer`
6. Click "Launch Election"
7. Approve transaction in MetaMask
8. Wait for confirmation

### Add Candidates

1. Go to "Add Candidates" tab
2. Select the election you just created
3. Fill in candidate details:
   - Name: `John Doe`
   - Employee ID: `EMP001`
   - Department: `Engineering`
   - Bio: `Experienced leader with 10 years...`
4. Click "Register Candidate"
5. Approve transaction in MetaMask
6. Repeat for more candidates

### Vote as Employee

1. Logout (click 🚪 icon)
2. Go back to login page
3. Click "Login as Employee"
4. Enter Employee ID: `EMP123` (or any from `backend/data/employees.json`)
5. Click "Vote" in navigation
6. Select the election
7. Review candidates
8. Click "Vote" on your preferred candidate
9. Approve transaction in MetaMask
10. See confirmation!

---

## 🔧 Troubleshooting

### Issue: "Failed to connect to blockchain"

**Solution**: Make sure Hardhat node is running in Terminal 1

### Issue: "MetaMask not connecting"

**Solution**: 
1. Check you're on Hardhat Local network in MetaMask
2. Try resetting MetaMask: Settings → Advanced → Reset Account

### Issue: "Firebase blocked by ad blocker"

**Solution**: 
1. Disable ad blocker for localhost
2. Or whitelist `*.googleapis.com`
3. The app will still work, but metadata won't save

### Issue: "Transaction failed"

**Solution**:
1. Make sure you have ETH in your MetaMask account
2. Try resetting MetaMask account
3. Restart Hardhat node and redeploy contracts

### Issue: "Port already in use"

**Solution**:
```bash
# Windows
netstat -ano | findstr :5174
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5174 | xargs kill -9
```

---

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
- Explore the smart contracts in `contracts/` folder
- Customize the UI in `katana-react/src/` folder

---

## 🆘 Need Help?

- Open an issue on GitHub
- Check existing issues for solutions
- Read the troubleshooting section above

---

**Happy Voting! 🗳️**
