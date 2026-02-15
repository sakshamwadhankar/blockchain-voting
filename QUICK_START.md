# ⚡ Quick Start - National Election System

## Get Running in 3 Commands

---

## Prerequisites

- Node.js 18+ installed
- MetaMask browser extension
- Git

---

## Installation

```bash
# 1. Install dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 2. Start blockchain (Terminal 1)
npx hardhat node

# 3. Deploy & test (Terminal 2)
npx hardhat run scripts/test-election-system.js --network localhost

# 4. Start frontend (Terminal 3)
cd frontend && npm run dev

# 5. Start backend (Terminal 4 - optional)
cd backend && npm start
```

---

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Blockchain RPC**: http://127.0.0.1:8545

### Main Pages
- **Election Dashboard**: http://localhost:5173/elections (View results)
- **Election Admin**: http://localhost:5173/election-admin (Create, manage, and vote)

---

## Quick Test Flow

### 1. Connect MetaMask
- Network: Hardhat Local
- RPC: http://127.0.0.1:8545
- Chain ID: 31337
- Import account from hardhat node output

### 2. Navigate to Election Admin
http://localhost:5173/election-admin

### 3. Create Election
- Position: "CEO 2024"
- Duration: 7 days
- Click "Create Election"

### 4. Add Candidates (Add 3-4)
```
Candidate 1:
- Name: Alice Johnson
- Employee ID: EMP-001
- Department: Engineering

Candidate 2:
- Name: Bob Smith
- Employee ID: EMP-002
- Department: Operations

Candidate 3:
- Name: Carol Williams
- Employee ID: EMP-003
- Department: Finance
```

### 5. View Dashboard
http://localhost:5173/elections
- See your election
- View candidates
- Check empty audit trail

### 6. Cast Votes
http://localhost:5173/election-admin (Click "Cast Vote (Test)" tab)

For testing, use:
- Corporate ID: TEST-001
- MFA Code: 123456
- Voter Token: 0x1234567890123456789012345678901234567890123456789012345678901234

Select candidate and vote!

### 7. Watch Live Updates
Go back to dashboard - see:
- Vote counts updated
- Charts refreshed
- Audit trail populated
- Live notifications

---

## File Structure

```
blockchain-voting/
├── contracts/core/
│   ├── ElectionManager.sol      ← Main contract
│   ├── Governance.sol            ← Original governance
│   └── Vault.sol                 ← Treasury
├── scripts/
│   ├── deploy-election.js        ← Deploy script
│   └── test-election-system.js   ← Comprehensive tests
├── frontend/src/
│   ├── pages/
│   │   ├── ElectionDashboard.jsx ← Live results
│   │   ├── CastVote.jsx          ← Voting interface
│   │   └── ElectionAdmin.jsx     ← Admin panel
│   └── services/
│       └── electionService.js    ← Blockchain service
└── Documentation/
    ├── ELECTION_SYSTEM.md        ← Full documentation
    ├── DEPLOYMENT_GUIDE.md       ← Step-by-step guide
    ├── HACKATHON_PITCH.md        ← Pitch deck
    └── QUICK_START.md            ← This file
```

---

## Key Features Implemented

✅ Multi-candidate elections (up to 10)
✅ MFA token authentication
✅ One-person-one-vote enforcement
✅ Privacy-preserving vote recording
✅ Real-time dashboard with charts
✅ Complete audit trail
✅ IPFS manifesto integration
✅ Emergency pause functionality
✅ Gas-optimized operations
✅ Event-driven updates

---

## Testing Checklist

Run through this to verify everything works:

- [ ] Hardhat node running
- [ ] Contract deployed successfully
- [ ] MetaMask connected
- [ ] Create election works
- [ ] Add candidates works (add 3+)
- [ ] Dashboard shows election
- [ ] Cast vote works
- [ ] Charts update in real-time
- [ ] Audit trail populates
- [ ] Double voting prevented
- [ ] Invalid token rejected

---

## Common Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to localhost
npx hardhat run scripts/deploy-election.js --network localhost

# Run comprehensive test
npx hardhat run scripts/test-election-system.js --network localhost

# Start frontend dev server
cd frontend && npm run dev

# Build frontend for production
cd frontend && npm run build

# Start backend
cd backend && npm start
```

---

## Troubleshooting

### "Cannot connect to network"
→ Make sure `npx hardhat node` is running

### "Transaction failed"
→ Reset MetaMask account (Settings → Advanced → Reset Account)

### "Already voted"
→ Use different MetaMask account or Corporate ID

### "Invalid voter token"
→ Request new token or use test token for development

### Charts not showing
→ Make sure recharts is installed: `cd frontend && npm install recharts`

---

## Environment Variables

### Backend (.env)
```
PORT=5000
BLOCKCHAIN_RPC=http://127.0.0.1:8545
ELECTION_CONTRACT_ADDRESS=<from deployment>
```

### Frontend (.env)
```
VITE_BLOCKCHAIN_RPC=http://127.0.0.1:8545
VITE_BACKEND_URL=http://localhost:5000
```

---

## Production Deployment

### 1. Deploy to Testnet
```bash
# Add to .env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_private_key

# Deploy
npx hardhat run scripts/deploy-election.js --network sepolia
```

### 2. Update Frontend Config
```javascript
// frontend/src/services/electionService.js
const ELECTION_MANAGER_ADDRESS = "0xYourSepoliaAddress";
```

### 3. Deploy Frontend
```bash
cd frontend
npm run build
# Upload dist/ to Vercel/Netlify
```

---

## Support & Resources

- **Full Documentation**: See ELECTION_SYSTEM.md
- **Deployment Guide**: See DEPLOYMENT_GUIDE.md
- **Hackathon Pitch**: See HACKATHON_PITCH.md
- **Smart Contract**: contracts/core/ElectionManager.sol
- **Frontend Service**: frontend/src/services/electionService.js

---

## Next Steps

1. ✅ Get system running locally
2. ✅ Test all features
3. ✅ Customize for your use case
4. ✅ Deploy to testnet
5. ✅ Present at hackathon
6. 🏆 Win!

---

**Need help? Check the comprehensive documentation in ELECTION_SYSTEM.md**

🗳️ **Happy Voting!**
