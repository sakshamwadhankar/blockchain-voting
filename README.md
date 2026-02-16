# KWOTE - Blockchain Voting Platform

<div align="center">

![KWOTE Logo](https://img.shields.io/badge/KWOTE-Blockchain%20Voting-yellow?style=for-the-badge)

**Secure, Transparent, and Immutable Corporate Voting System**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=flat-square&logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22.0-yellow?style=flat-square)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.1.0-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Usage Guide](#usage-guide)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**KWOTE** is a decentralized voting platform built on Ethereum blockchain technology, designed for secure corporate elections. It combines blockchain immutability with biometric authentication to ensure transparent, tamper-proof voting processes.

### Key Highlights

- 🔐 **Blockchain-Powered**: Every vote is an immutable transaction on Ethereum
- 🪪 **Biometric Verification**: Employee ID verification before voting
- 📊 **Real-Time Results**: Live vote counting with transparent tallying
- 🎨 **Modern UI**: Beautiful 3D landing page with React Three Fiber
- 🔥 **Firebase Integration**: Metadata storage for rich candidate profiles
- 👨‍💼 **Admin Dashboard**: Complete election management interface

---

## ✨ Features

### For Voters
- ✅ Secure employee ID verification
- ✅ One-time voting per election
- ✅ View active elections and candidates
- ✅ Real-time vote confirmation
- ✅ Transparent result viewing

### For Administrators
- ✅ Create and manage elections
- ✅ Add candidates with profiles and manifestos
- ✅ Set voting duration and rules
- ✅ Finalize elections and publish results
- ✅ Monitor voting activity in real-time

### Technical Features
- ✅ Smart contract-based vote storage
- ✅ Gas-optimized Solidity code
- ✅ MetaMask wallet integration
- ✅ Firebase for metadata and file storage
- ✅ Responsive design for all devices
- ✅ Ad blocker detection and handling

---

## 🛠 Tech Stack

### Blockchain
- **Solidity 0.8.24** - Smart contract development
- **Hardhat** - Development environment and testing
- **OpenZeppelin** - Secure contract libraries
- **Ethers.js v6** - Ethereum interaction library

### Frontend
- **React 18.3** - UI framework
- **Vite** - Build tool and dev server
- **React Three Fiber** - 3D graphics and animations
- **Framer Motion** - Smooth animations
- **TailwindCSS** - Utility-first styling
- **React Router** - Client-side routing

### Backend & Storage
- **Node.js + Express** - Backend API server
- **Firebase Firestore** - NoSQL database for metadata
- **Firebase Storage** - File storage for images and documents
- **Firebase Auth** - Authentication (optional)

---

## 📁 Project Structure

```
kwote/
├── contracts/              # Solidity smart contracts
│   ├── core/
│   │   ├── ElectionManager.sol    # Main election contract
│   │   ├── Governance.sol         # Legacy governance contract
│   │   └── Vault.sol              # Token vault contract
│   └── tokens/
│       └── MyERC20.sol            # Voting token contract
│
├── scripts/               # Deployment and utility scripts
│   ├── deploy-election.js         # Deploy ElectionManager
│   ├── migrate-to-firebase.js     # Data migration
│   └── test-election-system.js    # Testing utilities
│
├── katana-react/          # Frontend React application
│   ├── public/
│   │   └── deployments/           # Contract deployment info
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API and blockchain services
│   │   ├── context/               # React context providers
│   │   ├── config/                # Configuration files
│   │   └── App.jsx                # Main app component
│   ├── .env                       # Environment variables
│   └── package.json
│
├── backend/               # Express.js backend server
│   ├── data/
│   │   └── employees.json         # Employee database
│   ├── server.js                  # Main server file
│   ├── .env                       # Backend environment variables
│   └── package.json
│
├── deployments/           # Contract deployment artifacts
├── artifacts/             # Compiled contract artifacts
├── test/                  # Smart contract tests
├── hardhat.config.ts      # Hardhat configuration
├── .env.example           # Example environment variables
└── README.md              # This file
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **Git** - Version control
- **MetaMask** - Browser extension for Ethereum wallet
- **Firebase Account** - For metadata storage (free tier works)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/kwote.git
cd kwote
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd katana-react
npm install
cd ..
```

### 4. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

---

## ⚙️ Configuration

### 1. Root Environment Variables

Create a `.env` file in the root directory:

```env
# Blockchain Configuration
PRIVATE_KEY=your_wallet_private_key_here
INFURA_API_KEY=your_infura_api_key_here

# Network RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
```

### 2. Frontend Environment Variables

Create `katana-react/.env`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Blockchain Configuration
VITE_BLOCKCHAIN_RPC=http://127.0.0.1:8545
VITE_ELECTION_MANAGER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 3. Backend Environment Variables

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
```

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database**
4. Enable **Storage**
5. Get your configuration from Project Settings
6. Update the frontend `.env` file with your Firebase credentials

### 5. MetaMask Setup

1. Install [MetaMask](https://metamask.io/) browser extension
2. Create or import a wallet
3. For local development, add Hardhat Network:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

---

## 🏃 Running the Application

### Step 1: Start Hardhat Local Blockchain

Open a terminal and run:

```bash
npx hardhat node
```

This starts a local Ethereum node on `http://127.0.0.1:8545`

### Step 2: Deploy Smart Contracts

Open a new terminal and deploy the contracts:

```bash
npx hardhat run scripts/deploy-election.js --network localhost
```

This will:
- Deploy the ElectionManager contract
- Save deployment info to `deployments/election-localhost.json`
- Copy deployment info to `katana-react/public/deployments/`

### Step 3: Start Backend Server

Open a new terminal:

```bash
cd backend
npm start
```

Backend runs on `http://localhost:5000`

### Step 4: Start Frontend Development Server

Open a new terminal:

```bash
cd katana-react
npm run dev
```

Frontend runs on `http://localhost:5174`

### Step 5: Access the Application

Open your browser and navigate to:
- **Landing Page**: http://localhost:5174
- **Login**: http://localhost:5174/login
- **Admin Panel**: http://localhost:5174/admin

---

## 📝 Usage Guide

### For Administrators

1. **Login as Admin**
   - Go to Login page
   - Click "Login as Admin"
   - Default credentials: `admin` / `admin123`

2. **Create an Election**
   - Navigate to Admin Dashboard
   - Click "Create Election" tab
   - Fill in election details (position, duration, description)
   - Optionally upload a banner image
   - Click "Launch Election"

3. **Add Candidates**
   - Go to "Add Candidates" tab
   - Select the election
   - Enter candidate details (name, employee ID, department)
   - Upload photo and manifesto (optional)
   - Click "Register Candidate"

4. **Manage Elections**
   - View all elections in "Manage Elections" tab
   - Monitor vote counts in real-time
   - Finalize elections after voting period ends
   - Publish results to blockchain

### For Employees

1. **Verify Identity**
   - Go to Login page
   - Click "Login as Employee"
   - Enter your Employee ID
   - Complete verification

2. **Cast Your Vote**
   - Navigate to "Vote" page
   - View active elections
   - Click on an election to see candidates
   - Review candidate profiles and manifestos
   - Click "Vote" on your preferred candidate
   - Confirm transaction in MetaMask

3. **View Results**
   - Go to "Elections" page
   - View live vote counts
   - See finalized results after election ends

---

## 🔒 Security

### Smart Contract Security
- ✅ Uses OpenZeppelin audited libraries
- ✅ Implements access control (Ownable)
- ✅ Prevents double voting
- ✅ Immutable vote records
- ✅ Gas-optimized operations

### Application Security
- ✅ Employee ID verification
- ✅ Wallet-based authentication
- ✅ Admin role protection
- ✅ HTTPS recommended for production
- ✅ Environment variable protection

### Best Practices
- Never commit `.env` files
- Use hardware wallets for production
- Audit smart contracts before mainnet deployment
- Enable Firebase security rules
- Implement rate limiting on backend

---

## 🧪 Testing

### Run Smart Contract Tests

```bash
npx hardhat test
```

### Run with Coverage

```bash
npx hardhat coverage
```

### Test Specific File

```bash
npx hardhat test test/ElectionManager.test.js
```

---

## 🚢 Deployment

### Deploy to Testnet (Sepolia)

1. Get testnet ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
2. Update `.env` with your private key and Infura API key
3. Deploy:

```bash
npx hardhat run scripts/deploy-election.js --network sepolia
```

### Deploy to Mainnet

⚠️ **Warning**: Deploying to mainnet costs real ETH. Ensure thorough testing first.

```bash
npx hardhat run scripts/deploy-election.js --network mainnet
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Firebase blocked by ad blocker
- **Solution**: Disable ad blocker or whitelist `*.googleapis.com`

**Issue**: MetaMask not connecting
- **Solution**: Ensure you're on the correct network (Hardhat Local for development)

**Issue**: Contract deployment fails
- **Solution**: Check that Hardhat node is running and you have sufficient ETH

**Issue**: Frontend can't find contract
- **Solution**: Verify deployment file exists in `katana-react/public/deployments/`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For support, email support@kwote.io or open an issue on GitHub.

---

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Hardhat for excellent development tools
- React Three Fiber for 3D graphics
- Firebase for backend infrastructure
- The Ethereum community

---

<div align="center">

**Built with ❤️ for transparent corporate governance**

[Website](https://kwote.io) · [Documentation](https://docs.kwote.io) · [Report Bug](https://github.com/yourusername/kwote/issues)

</div>
