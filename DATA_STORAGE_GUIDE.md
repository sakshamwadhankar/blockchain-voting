# 💾 Data Storage Guide

## Complete Overview of Where Data is Stored

---

## 📊 Data Storage Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA STORAGE LAYERS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Blockchain (Ethereum/Hardhat)                           │
│     └─ Election data, votes, audit trail                    │
│                                                              │
│  2. Backend Server (Node.js)                                │
│     └─ Employee data, face descriptors                      │
│                                                              │
│  3. Browser (LocalStorage)                                  │
│     └─ Auth tokens, session data                            │
│                                                              │
│  4. IPFS (Optional)                                         │
│     └─ Candidate manifestos                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 1. Blockchain Storage (Permanent & Immutable)

### Location
- **Network**: Hardhat Local Node (http://127.0.0.1:8545)
- **Smart Contracts**: 
  - `ElectionManager.sol` at `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
  - `Governance.sol` at address in `deployments/localhost.json`
  - `Vault.sol` at address in `deployments/localhost.json`

### What's Stored

#### Election Data
```solidity
struct Election {
    string position;           // "CEO 2024"
    uint256 startTime;        // Unix timestamp
    uint256 endTime;          // Unix timestamp
    bool isActive;            // true/false
    bool resultsPublished;    // true/false
    uint256 totalVotes;       // Vote count
    uint256 candidateCount;   // Number of candidates
    mapping(uint256 => Candidate) candidates;
    mapping(bytes32 => bool) hasVoted;
    mapping(bytes32 => bytes32) voteCommitments;
}
```

**Example**:
```
Election ID: 0
Position: "board member"
Start: 1708041726 (Feb 15, 2026)
End: 1708646526 (Feb 22, 2026)
Total Votes: 0
Candidates: 0
```

#### Candidate Data
```solidity
struct Candidate {
    string name;              // "pradum"
    string employeeId;        // "25070521189"
    string department;        // "engineering"
    string manifestoIPFS;     // IPFS hash (empty if not used)
    uint256 voteCount;        // Number of votes received
    bool isActive;            // true/false
}
```

#### Vote Records (Audit Trail)
```solidity
struct VoteRecord {
    uint256 electionId;       // Which election
    uint256 timestamp;        // When vote was cast
    bytes32 voterHash;        // Hashed corporate ID (anonymous)
    bool verified;            // MFA verified
}
```

**Privacy Protection**:
- Corporate IDs are hashed: `keccak256("CORP-001")` → `0x1234...`
- Vote choice is NOT linked to voter identity
- Only the fact that someone voted is recorded

### How to View Blockchain Data

**Method 1: Using Frontend**
- Dashboard: http://localhost:5173/elections
- Admin Panel: http://localhost:5173/election-admin

**Method 2: Using Hardhat Console**
```bash
npx hardhat console --network localhost

# Get election data
const ElectionManager = await ethers.getContractAt("ElectionManager", "0x9fE4...");
const election = await ElectionManager.getElection(0);
console.log(election);

# Get candidate data
const candidate = await ElectionManager.getCandidate(0, 0);
console.log(candidate);
```

**Method 3: Check Hardhat Node Logs**
- Look at the terminal running `npx hardhat node`
- Shows all transactions and events

---

## 📁 2. Backend Server Storage (JSON Files)

### Location
```
backend/
└── data/
    └── employees.json
```

### What's Stored

#### Employee Data
```json
{
  "MNC-001": {
    "id": "MNC-001",
    "name": "Saksham Wadhankar",
    "phone": "+919876543210",
    "department": "Engineering",
    "position": "Senior Developer",
    "faceDescriptor": [0.123, -0.456, 0.789, ...], // 128 numbers
    "isVerified": false,
    "authorizedWallet": null
  }
}
```

**Fields Explained**:
- `id`: Employee ID (unique identifier)
- `name`: Full name
- `phone`: Phone number for OTP
- `department`: Department name
- `position`: Job title
- `faceDescriptor`: 128-dimensional face recognition vector
- `isVerified`: Whether biometric is registered
- `authorizedWallet`: MetaMask wallet address (if bound)

#### Face Descriptor Storage
The `faceDescriptor` is an array of 128 floating-point numbers generated by face-api.js:

```json
"faceDescriptor": [
  0.12345,
  -0.67890,
  0.23456,
  // ... 125 more numbers
]
```

**How Face Recognition Works**:
1. Camera captures face
2. face-api.js extracts 128 numbers (descriptor)
3. First time: Descriptor saved to `employees.json`
4. Next time: New descriptor compared with saved one
5. If distance < 0.5: Match! ✅

### File Location
```
C:\Users\saksham\OneDrive\Documents\GitHub\blockchain voting\backend\data\employees.json
```

### How to View/Edit
```bash
# View file
cat backend/data/employees.json

# Or open in editor
code backend/data/employees.json
```

### Backup Recommendation
```bash
# Backup employee data
copy backend\data\employees.json backend\data\employees.backup.json

# Restore from backup
copy backend\data\employees.backup.json backend\data\employees.json
```

---

## 🌐 3. Browser Storage (Temporary)

### Location
- **Browser**: Chrome/Firefox/Edge LocalStorage
- **Path**: Application → Local Storage → http://localhost:5173

### What's Stored

#### Authentication Data
```javascript
localStorage.setItem('user', JSON.stringify({
  id: "MNC-001",
  name: "Saksham Wadhankar",
  type: "employee",
  isVerified: true
}));
```

#### Wallet Connection
```javascript
localStorage.setItem('walletConnected', 'true');
localStorage.setItem('walletAddress', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
```

### How to View Browser Storage

**Chrome DevTools**:
1. Press F12
2. Go to "Application" tab
3. Expand "Local Storage"
4. Click "http://localhost:5173"
5. See all stored data

**Clear Browser Storage**:
```javascript
// In browser console (F12)
localStorage.clear();
```

---

## 📦 4. IPFS Storage (Optional - Decentralized)

### Location
- **Network**: IPFS (InterPlanetary File System)
- **Gateway**: https://ipfs.io/ipfs/

### What's Stored

#### Candidate Manifestos
When you add a candidate with an IPFS hash:
```
manifestoIPFS: "QmAliceManifestoHash123"
```

The actual manifesto document is stored on IPFS, not on blockchain.

### How to Use IPFS

**Upload a Manifesto**:
```bash
# Install IPFS CLI
npm install -g ipfs

# Add file to IPFS
ipfs add manifesto.pdf
# Returns: QmXxx... (hash)

# Use this hash when adding candidate
```

**View Manifesto**:
```
https://ipfs.io/ipfs/QmAliceManifestoHash123
```

---

## 🗂️ Complete File Structure

```
blockchain-voting/
│
├── Blockchain Data (Hardhat Node)
│   └── In-memory (lost when node stops)
│       ├── Elections
│       ├── Candidates
│       ├── Votes
│       └── Audit Trail
│
├── backend/
│   └── data/
│       └── employees.json ← Employee & Face Data
│
├── frontend/
│   └── Browser LocalStorage
│       ├── Auth tokens
│       └── Session data
│
├── deployments/
│   ├── localhost.json ← Governance contract addresses
│   └── election-localhost.json ← Election contract address
│
└── IPFS (Optional)
    └── Candidate manifestos
```

---

## 📊 Data Flow Diagram

### Employee Registration Flow
```
1. Admin enters employee data
   ↓
2. Employee scans face
   ↓
3. face-api.js generates 128 numbers
   ↓
4. Saved to backend/data/employees.json
   ↓
5. Employee can now verify identity
```

### Election Creation Flow
```
1. Admin creates election
   ↓
2. Transaction sent to blockchain
   ↓
3. ElectionManager.sol stores data
   ↓
4. Event emitted
   ↓
5. Frontend updates
```

### Voting Flow
```
1. Voter casts vote
   ↓
2. Corporate ID hashed
   ↓
3. Vote recorded on blockchain
   ↓
4. Audit trail updated
   ↓
5. Vote count incremented
   ↓
6. Dashboard updates in real-time
```

---

## 🔒 Data Security

### Blockchain Data
- ✅ **Immutable**: Cannot be changed once written
- ✅ **Transparent**: Anyone can verify
- ✅ **Decentralized**: No single point of failure
- ⚠️ **Public**: All data is visible (but anonymized)

### Employee Data
- ⚠️ **Centralized**: Stored in JSON file
- ⚠️ **Mutable**: Can be edited
- ✅ **Private**: Not on blockchain
- ⚠️ **Backup Needed**: File can be lost

### Face Descriptors
- ✅ **One-way**: Cannot reconstruct face from numbers
- ✅ **Private**: Not shared publicly
- ✅ **Secure**: Stored server-side only
- ⚠️ **Sensitive**: Should be encrypted in production

---

## 🔄 Data Persistence

### What Persists After Restart?

| Data Type | Persists? | Location |
|-----------|-----------|----------|
| Elections | ❌ No | Hardhat node (in-memory) |
| Votes | ❌ No | Hardhat node (in-memory) |
| Candidates | ❌ No | Hardhat node (in-memory) |
| Employees | ✅ Yes | backend/data/employees.json |
| Face Data | ✅ Yes | backend/data/employees.json |
| Auth Session | ❌ No | Browser LocalStorage (cleared) |
| Contract Code | ✅ Yes | contracts/ folder |

### Making Blockchain Data Persistent

**Option 1: Use Testnet (Sepolia)**
```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy-election.js --network sepolia
```
Data persists forever on Ethereum testnet.

**Option 2: Use Hardhat Network with Forking**
```javascript
// hardhat.config.js
networks: {
  hardhat: {
    forking: {
      url: "https://eth-mainnet.alchemyapi.io/v2/YOUR-API-KEY"
    }
  }
}
```

**Option 3: Export/Import State**
```bash
# Export blockchain state
npx hardhat node --export state.json

# Import on restart
npx hardhat node --import state.json
```

---

## 📝 Data Backup Strategy

### Daily Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d)

# Backup employee data
cp backend/data/employees.json backups/employees_$DATE.json

# Backup deployment info
cp deployments/*.json backups/deployments_$DATE/

echo "Backup completed: $DATE"
```

### Restore from Backup
```bash
# Restore employee data
cp backups/employees_20260215.json backend/data/employees.json

# Redeploy contracts
npx hardhat run scripts/deploy-election.js --network localhost
```

---

## 🔍 How to Inspect Data

### 1. View Employee Data
```bash
# Pretty print JSON
cat backend/data/employees.json | python -m json.tool

# Or use jq
cat backend/data/employees.json | jq '.'
```

### 2. View Blockchain Data
```javascript
// In Hardhat console
npx hardhat console --network localhost

const ElectionManager = await ethers.getContractAt(
  "ElectionManager", 
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
);

// Get all elections
const totalElections = await ElectionManager.nextElectionId();
console.log("Total Elections:", totalElections.toString());

// Get specific election
const election = await ElectionManager.getElection(0);
console.log("Election:", election);

// Get audit trail
const auditLength = await ElectionManager.getAuditTrailLength();
console.log("Audit Records:", auditLength.toString());
```

### 3. View Browser Data
```javascript
// In browser console (F12)
console.log("User:", localStorage.getItem('user'));
console.log("Wallet:", localStorage.getItem('walletAddress'));
```

---

## 📊 Data Size Estimates

### Blockchain Data
```
Election: ~500 bytes
Candidate: ~300 bytes
Vote Record: ~100 bytes
Audit Trail Entry: ~150 bytes

Example:
1 Election + 10 Candidates + 100 Votes
= 500 + (10 × 300) + (100 × 150)
= 500 + 3,000 + 15,000
= 18,500 bytes (~18 KB)
```

### Employee Data
```
Employee Record: ~500 bytes
Face Descriptor: ~1 KB (128 floats)

Example:
100 Employees with Face Data
= 100 × 1,500 bytes
= 150,000 bytes (~150 KB)
```

---

## 🎯 Summary

### Quick Reference

| Data Type | Storage Location | Persistent? | Encrypted? |
|-----------|-----------------|-------------|------------|
| Elections | Blockchain | ❌ (local) | ❌ |
| Candidates | Blockchain | ❌ (local) | ❌ |
| Votes | Blockchain | ❌ (local) | ✅ (hashed) |
| Employees | JSON File | ✅ | ❌ |
| Face Data | JSON File | ✅ | ❌ |
| Auth Session | Browser | ❌ | ❌ |
| Manifestos | IPFS | ✅ | ❌ |

### File Paths
```
Employee Data:
C:\Users\saksham\OneDrive\Documents\GitHub\blockchain voting\backend\data\employees.json

Contract Addresses:
C:\Users\saksham\OneDrive\Documents\GitHub\blockchain voting\deployments\election-localhost.json

Browser Storage:
Chrome → F12 → Application → Local Storage → http://localhost:5173
```

---

## 🔐 Production Recommendations

For production deployment:

1. **Encrypt Employee Data**
   ```javascript
   const crypto = require('crypto');
   // Encrypt face descriptors before saving
   ```

2. **Use Database Instead of JSON**
   ```
   MongoDB, PostgreSQL, or MySQL
   ```

3. **Deploy to Real Blockchain**
   ```
   Ethereum Mainnet, Polygon, or Arbitrum
   ```

4. **Implement Proper Backup**
   ```
   Automated daily backups to cloud storage
   ```

5. **Add Access Control**
   ```
   JWT tokens, role-based permissions
   ```

---

**All your data is now documented and easy to find!** 📚
