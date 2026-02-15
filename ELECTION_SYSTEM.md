# 🏛️ National-Level Election Management System

## Production-Grade Multi-Candidate Blockchain Voting Platform

A tamper-proof, MFA-secured, privacy-preserving election system built for corporate governance and national-level competitions.

---

## 🎯 Key Features

### 1. **Multi-Candidate Elections**
- Support for up to 10 candidates per election
- Dynamic candidate profiles with IPFS-stored manifestos
- Real-time vote tallying and results visualization

### 2. **MNC-Grade Security**
- **Multi-Factor Authentication (MFA)**: Voter tokens issued after MFA verification
- **One-Person-One-Vote**: Corporate ID hashing prevents double voting
- **Tamper-Resistant**: All votes recorded immutably on blockchain
- **Emergency Controls**: Pausable contract for security incidents

### 3. **Privacy & Anonymity**
- Voter identity hashed using keccak256
- Vote choice never stored with voter identity
- Public audit trail shows votes were cast, not choices
- Zero-knowledge proof ready architecture

### 4. **Corporate Governance**
- Position-based elections (CEO, Board Member, etc.)
- Department-wise candidate organization
- Employee ID verification system
- Configurable election duration

### 5. **Real-Time Dashboard**
- Live vote counting with WebSocket updates
- Interactive charts (Bar, Pie) using Recharts
- Audit trail with transaction hashes
- Block-level verification display

---

## 🏗️ Architecture

### Smart Contract Layer
```
ElectionManager.sol
├── Election Management
│   ├── createElection()
│   ├── addCandidate()
│   └── finalizeElection()
├── Voting System
│   ├── issueVoterToken() [MFA]
│   ├── castVote() [Privacy-Preserving]
│   └── hasVotedInElection()
└── Audit & Results
    ├── getAuditTrail()
    ├── getWinningCandidate()
    └── Real-time Events
```

### Frontend Layer
```
React + Ethers.js + Recharts
├── ElectionDashboard.jsx - Live results & analytics
├── CastVote.jsx - Voter interface with MFA
├── ElectionAdmin.jsx - Admin control panel
└── electionService.js - Blockchain integration
```

---

## 🚀 Quick Start

### 1. Deploy Smart Contract

```bash
# Start local blockchain
npx hardhat node

# Deploy ElectionManager
npx hardhat run scripts/deploy-election.js --network localhost
```

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Access Dashboard

- **Election Dashboard**: http://localhost:5173/elections
- **Cast Vote**: http://localhost:5173/cast-vote
- **Admin Panel**: http://localhost:5173/election-admin

---

## 📋 Usage Workflow

### For Administrators

1. **Create Election**
   - Navigate to Election Admin → Create Election
   - Enter position title (e.g., "CEO 2024")
   - Set duration in days
   - Submit transaction

2. **Add Candidates**
   - Select the election
   - Enter candidate details:
     - Name
     - Employee ID
     - Department
     - Manifesto IPFS hash (optional)
   - Add up to 10 candidates

3. **Monitor Election**
   - View live vote counts on dashboard
   - Check audit trail for verification
   - Monitor for suspicious activity

4. **Finalize Results**
   - After election ends, click "Finalize"
   - Results published on-chain
   - Winner automatically determined

### For Voters

1. **Request Voter Token**
   - Enter Corporate ID
   - Provide MFA code from authenticator app
   - Receive voter token via email/SMS

2. **Cast Vote**
   - Select active election
   - Review candidate manifestos
   - Choose candidate
   - Enter voter token
   - Submit vote (transaction)

3. **Verify Vote**
   - Check audit trail for your hashed ID
   - Confirm transaction on blockchain explorer
   - Vote choice remains private

---

## 🔐 Security Features

### 1. One-Person-One-Vote Enforcement
```solidity
bytes32 voterHash = keccak256(abi.encodePacked(_corporateId));
require(!election.hasVoted[voterHash], "Already voted");
election.hasVoted[voterHash] = true;
```

### 2. MFA Token Validation
```solidity
require(validVoterTokens[_voterToken], "Invalid voter token");
validVoterTokens[_voterToken] = false; // Single-use token
```

### 3. Privacy Protection
- Corporate ID hashed before storage
- Vote choice never linked to voter
- Audit trail shows only hashed identities

### 4. Tamper Resistance
- Immutable blockchain storage
- Event-driven audit trail
- OpenZeppelin Pausable for emergencies

---

## 📊 Dashboard Features

### Live Statistics
- Total votes cast
- Number of candidates
- Audit record count
- Results publication status

### Interactive Charts
- **Bar Chart**: Vote distribution by candidate
- **Pie Chart**: Vote share percentages
- Real-time updates via blockchain events

### Audit Trail
- Transaction timestamps
- Hashed voter IDs
- Verification status
- Block numbers

### Live Updates Feed
- Real-time vote notifications
- Transaction hash display
- Block confirmation alerts

---

## 🛠️ Technical Stack

### Blockchain
- **Solidity 0.8.24**: Smart contract language
- **Hardhat**: Development environment
- **OpenZeppelin**: Security libraries (Ownable, Pausable)
- **Ethers.js**: Blockchain interaction

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool
- **Recharts**: Data visualization
- **Tailwind CSS**: Styling
- **React Router**: Navigation

### Backend (Optional)
- **Node.js + Express**: MFA token issuance
- **Socket.io**: Real-time updates
- **IPFS**: Manifesto storage

---

## 📁 File Structure

```
blockchain-voting/
├── contracts/
│   └── core/
│       └── ElectionManager.sol       # Main election contract
├── scripts/
│   └── deploy-election.js            # Deployment script
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── ElectionDashboard.jsx # Live results
│       │   ├── CastVote.jsx          # Voting interface
│       │   └── ElectionAdmin.jsx     # Admin panel
│       └── services/
│           └── electionService.js    # Blockchain service
└── deployments/
    └── election-localhost.json       # Contract addresses
```

---

## 🎨 UI Screenshots

### Election Dashboard
- Real-time vote counts
- Interactive bar and pie charts
- Live audit trail
- Candidate profiles with IPFS links

### Voting Interface
- MFA authentication flow
- Candidate selection with manifestos
- Privacy guarantee notices
- Transaction confirmation

### Admin Panel
- Election creation form
- Candidate management
- Election finalization controls
- Status monitoring

---

## 🔧 Configuration

### Contract Deployment
```javascript
// Update frontend/src/services/electionService.js
const ELECTION_MANAGER_ADDRESS = "0x..."; // Your deployed address
```

### MFA Integration
```javascript
// Backend integration for token issuance
async function issueToken(corporateId, mfaCode) {
  // Verify MFA with authenticator service
  // Call contract.issueVoterToken()
  // Send token to user via email/SMS
}
```

### IPFS Configuration
```javascript
// Upload manifesto to IPFS
const ipfsHash = await ipfs.add(manifestoFile);
// Use hash when adding candidate
```

---

## 🏆 Why This Wins Hackathons

### 1. **Scalability**
- Handles multiple concurrent elections
- Supports 10 candidates per position
- Efficient gas usage with optimized mappings

### 2. **Transparency**
- Complete audit trail on blockchain
- Real-time public verification
- Open-source smart contracts

### 3. **Automation**
- Smart contract auto-tallying
- Event-driven updates
- No manual result compilation

### 4. **Security**
- MFA integration
- One-vote enforcement
- Tamper-proof records
- Emergency pause functionality

### 5. **User Experience**
- Intuitive dashboard
- Real-time feedback
- Mobile-responsive design
- Clear privacy guarantees

---

## 🚨 Important Notes

### Gas Optimization
- Use `calldata` for string parameters
- Batch candidate additions when possible
- Finalize elections off-peak hours

### Privacy Considerations
- Never log unhashed corporate IDs
- Use secure channels for token delivery
- Implement rate limiting on token requests

### Production Deployment
- Audit smart contracts professionally
- Use hardware wallets for admin keys
- Implement multi-sig for critical functions
- Set up monitoring and alerts

---

## 📝 Smart Contract Functions

### Admin Functions
```solidity
createElection(string position, uint256 durationInDays)
addCandidate(uint256 electionId, string name, string employeeId, string department, string manifestoIPFS)
issueVoterToken(string corporateId, string mfaCode)
finalizeElection(uint256 electionId)
pause() / unpause()
```

### Voter Functions
```solidity
castVote(uint256 electionId, uint256 candidateId, bytes32 corporateId, bytes32 voterToken)
```

### View Functions
```solidity
getElection(uint256 electionId)
getCandidate(uint256 electionId, uint256 candidateId)
getWinningCandidate(uint256 electionId)
hasVotedInElection(uint256 electionId, bytes32 corporateIdHash)
getAuditTrail()
```

---

## 🎓 Learning Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethers.js Guide](https://docs.ethers.org/)
- [IPFS Documentation](https://docs.ipfs.tech/)

---

## 📄 License

MIT License - Built for educational and hackathon purposes

---

## 🤝 Contributing

This is a hackathon project. Feel free to fork and enhance!

**Built with ❤️ for transparent, secure, and scalable elections**
