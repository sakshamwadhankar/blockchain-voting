# 🗳️ Blockchain Governance & Voting System

A secure, decentralized voting platform with AI-powered biometric verification, built on Ethereum blockchain.

## 🏛️ NEW: National-Level Election System

**Production-grade multi-candidate election management system with MFA security and real-time analytics!**

👉 **[Quick Start Guide](QUICK_START.md)** | **[Full Documentation](ELECTION_SYSTEM.md)** | **[Hackathon Pitch](HACKATHON_PITCH.md)**

### Key Features
- ✅ Multi-candidate elections (up to 10 candidates)
- ✅ MFA token authentication
- ✅ Privacy-preserving vote recording
- ✅ Real-time dashboard with live charts
- ✅ Complete audit trail
- ✅ IPFS manifesto integration

### Quick Access
- **Dashboard**: http://localhost:5173/elections
- **Admin Panel** (includes voting): http://localhost:5173/election-admin

---

## ✨ Features

### 🔐 Multi-Layer Security
- **Blockchain-based voting** - Immutable and transparent
- **AI Face Recognition** - True biometric verification with database comparison
- **OTP Verification** - SMS-based two-factor authentication via Twilio
- **Wallet Authentication** - MetaMask integration
- **Sybil Protection** - One employee, one wallet binding

### 👤 Authentication System
- **Employee Login** - ID verification with face scan and OTP
- **Admin Panel** - Password-protected governance management
- **Protected Routes** - Role-based access control
- **Session Management** - Persistent login with localStorage

### 🧠 AI-Powered Biometrics
- **Face Detection** - Real-time face detection using face-api.js
- **Face Recognition** - 128-dimensional descriptor comparison
- **Registration Mode** - First-time face enrollment
- **Verification Mode** - Match against stored biometric data
- **Euclidean Distance** - Threshold-based matching (< 0.5)

### 📊 Governance Features
- **Proposal Creation** - Create governance proposals
- **Voting System** - Cast votes (For/Against)
- **Live Results** - Real-time vote tracking via WebSocket
- **Proposal Execution** - On-chain execution after voting period

## 🏗️ Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **face-api.js** - Face recognition
- **Tesseract.js** - OCR for ID scanning
- **ethers.js** - Blockchain interaction
- **Socket.io Client** - Real-time updates

### Backend
- **Node.js + Express** - API server
- **Twilio Verify** - OTP service
- **Socket.io** - WebSocket server
- **ethers.js** - Blockchain oracle

### Blockchain
- **Hardhat** - Development environment
- **Solidity** - Smart contracts
- **OpenZeppelin** - Security standards

## 📦 Installation

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Twilio account (for OTP)

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd blockchain-voting
```

### 2. Install Dependencies
```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install
```

### 3. Download AI Models
```bash
cd frontend
node scripts/download-models.cjs
```

This downloads face-api.js models to `frontend/public/models/`:
- SSD MobileNet V1 (face detection)
- Face Landmark 68 (facial landmarks)
- Face Recognition Model (ResNet-34)

### 4. Configure Environment Variables

**Backend `.env`:**
```env
PORT=5000
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid
RPC_URL=http://127.0.0.1:8545
ADMIN_PRIVATE_KEY=your_admin_private_key
GOVERNANCE_CONTRACT_ADDRESS=your_contract_address
```

**Root `.env`:**
```env
PRIVATE_KEY=your_deployment_private_key
```

### 5. Deploy Smart Contracts
```bash
# Start local blockchain
npx hardhat node

# In another terminal, deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address to `backend/.env` and `frontend/src/config/contracts.js`.

## 🚀 Running the Application

### Start Backend
```bash
cd backend
npm start
```
Server runs on `http://localhost:5000`

### Start Frontend
```bash
cd frontend
npm run dev
```
App runs on `http://localhost:5173`

### Start Blockchain (if not running)
```bash
npx hardhat node
```

## 📱 Usage

### Employee Workflow
1. **Login** - Click "Continue as Employee"
2. **Verify Identity**:
   - Scan or manually enter Employee ID
   - Face scan (auto-registers first time, verifies thereafter)
   - Enter OTP sent to registered phone
3. **Vote** - Access voting booth after verification
4. **View Results** - See live voting results

### Admin Workflow
1. **Login** - Enter admin password (default: `admin123`)
2. **Create Proposals** - Add new governance proposals
3. **Manage System** - Monitor votes and execute proposals

## 🔑 Default Credentials

### Admin
- Password: `admin123`

### Test Employees
- **MNC-ADMIN** - Demo Administrator
- **MNC-001** - Saksham Wadhankar
- **MNC-002** - Aarav Sharma
- **MNC-003** - Priya Patel

(See `backend/data/employees.json` for full list)

## 🏛️ Architecture

### Smart Contract Flow
```
Employee → Verify Identity → Authorized Voter
         ↓
    Cast Vote → Proposal
         ↓
    Vote Counted → Results
         ↓
    Proposal Executed (if passed)
```

### Face Recognition Flow
```
Capture Face → Extract Descriptor (128 numbers)
              ↓
         First Time?
         ↓         ↓
       Yes        No
         ↓         ↓
    Register   Compare with DB
         ↓         ↓
    Save to    Calculate Distance
    Database      ↓
              < 0.5? → Match ✅
              > 0.5? → Reject ❌
```

## 🔒 Security Features

1. **Blockchain Immutability** - Votes cannot be altered
2. **Biometric Verification** - Face recognition with database comparison
3. **OTP Authentication** - SMS-based verification
4. **Wallet Binding** - One employee = one wallet
5. **Role-Based Access** - Admin vs Employee permissions
6. **Protected Routes** - Authentication required for all pages

## 📁 Project Structure

```
blockchain-voting/
├── contracts/              # Solidity smart contracts
├── scripts/               # Deployment scripts
├── test/                  # Contract tests
├── backend/
│   ├── data/             # Employee database
│   └── server.js         # Express API + Socket.io
├── frontend/
│   ├── public/
│   │   └── models/       # face-api.js models
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # Auth & Wallet context
│   │   ├── pages/        # Main pages
│   │   └── config/       # Configuration
│   └── scripts/          # Model downloader
└── hardhat.config.ts     # Hardhat configuration
```

## 🛠️ Development

### Run Tests
```bash
npx hardhat test
```

### Compile Contracts
```bash
npx hardhat compile
```

### Deploy to Network
```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

## 📝 API Endpoints

### Backend API
- `GET /employee/:id` - Get employee details
- `POST /send-otp` - Send OTP to employee phone
- `POST /verify-otp` - Verify OTP and authorize wallet
- `POST /verify-biometric` - Face recognition verification
- `GET /results/:id` - Get proposal results

### WebSocket Events
- `newProposal` - New proposal created
- `newVote` - Vote cast on proposal

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) - Face recognition
- [OpenZeppelin](https://openzeppelin.com/) - Smart contract security
- [Hardhat](https://hardhat.org/) - Ethereum development
- [Twilio](https://www.twilio.com/) - SMS verification

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using React, Ethereum, and AI
