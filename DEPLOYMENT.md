# KWOTE - Deployment Guide

This guide covers deploying KWOTE to various networks (testnet and mainnet).

## 📋 Pre-Deployment Checklist

Before deploying to any network, ensure:

- [ ] All smart contracts are thoroughly tested
- [ ] Security audit completed (for mainnet)
- [ ] Environment variables configured
- [ ] Sufficient ETH for gas fees
- [ ] Firebase project created and configured
- [ ] Domain name registered (for production)
- [ ] SSL certificate obtained (for production)

---

## 🧪 Testnet Deployment (Sepolia)

### Step 1: Get Testnet ETH

Get free Sepolia ETH from faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

You'll need at least 0.1 ETH for deployment and testing.

### Step 2: Configure Environment

Update root `.env`:

```env
PRIVATE_KEY=your_wallet_private_key
INFURA_API_KEY=your_infura_api_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
```

### Step 3: Deploy Smart Contracts

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia
```

Save the deployed contract address from the output:
```
✅ ElectionManager deployed to: 0x1234...5678
```

### Step 4: Update Frontend Configuration

Update `katana-react/.env`:

```env
VITE_BLOCKCHAIN_RPC=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_ELECTION_MANAGER_ADDRESS=0x1234...5678
```

### Step 5: Deploy Frontend

#### Option A: Vercel (Recommended)

1. Push code to GitHub
2. Go to https://vercel.com/
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: Vite
   - Root Directory: `katana-react`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add environment variables from `katana-react/.env`
7. Click "Deploy"

#### Option B: Netlify

1. Push code to GitHub
2. Go to https://netlify.com/
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub and select repository
5. Configure:
   - Base directory: `katana-react`
   - Build command: `npm run build`
   - Publish directory: `katana-react/dist`
6. Add environment variables
7. Click "Deploy site"

### Step 6: Deploy Backend

#### Option A: Railway

1. Go to https://railway.app/
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - Root Directory: `backend`
   - Start Command: `npm start`
5. Add environment variables from `backend/.env`
6. Click "Deploy"

#### Option B: Render

1. Go to https://render.com/
2. Click "New" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables
6. Click "Create Web Service"

### Step 7: Update Frontend with Backend URL

Update `katana-react/.env`:

```env
VITE_BACKEND_URL=https://your-backend.railway.app
```

Redeploy frontend.

### Step 8: Test Everything

1. Visit your deployed frontend URL
2. Connect MetaMask (switch to Sepolia network)
3. Test admin login and election creation
4. Test employee login and voting
5. Verify transactions on Sepolia Etherscan

---

## 🚀 Mainnet Deployment

⚠️ **WARNING**: Mainnet deployment costs real ETH. Ensure thorough testing on testnet first.

### Step 1: Security Audit

Before mainnet deployment:

1. **Code Review**: Have experienced developers review your code
2. **Professional Audit**: Consider hiring a security firm:
   - OpenZeppelin
   - Trail of Bits
   - ConsenSys Diligence
3. **Bug Bounty**: Consider running a bug bounty program

### Step 2: Prepare Mainnet Wallet

1. Create a new wallet specifically for deployment
2. Transfer sufficient ETH for deployment (estimate: 0.5-1 ETH)
3. Never reuse this wallet for other purposes
4. Store private key securely (hardware wallet recommended)

### Step 3: Configure Environment

Update root `.env`:

```env
PRIVATE_KEY=your_mainnet_wallet_private_key
INFURA_API_KEY=your_infura_api_key
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Step 4: Deploy to Mainnet

```bash
# Final compilation
npm run compile

# Deploy to mainnet
npm run deploy:mainnet
```

### Step 5: Verify Contract on Etherscan

```bash
npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS
```

### Step 6: Production Frontend Deployment

Same as testnet, but update environment variables:

```env
VITE_BLOCKCHAIN_RPC=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
VITE_ELECTION_MANAGER_ADDRESS=0xYourMainnetAddress
VITE_BACKEND_URL=https://your-production-backend.com
```

### Step 7: Production Backend Deployment

1. Use production-grade hosting (AWS, Google Cloud, Azure)
2. Enable HTTPS
3. Set up monitoring and logging
4. Configure rate limiting
5. Set up database backups
6. Enable CORS for your frontend domain only

### Step 8: DNS and SSL

1. Point your domain to frontend hosting
2. Configure SSL certificate (Let's Encrypt or hosting provider)
3. Set up CDN (Cloudflare recommended)
4. Configure DNS records

### Step 9: Monitoring and Maintenance

Set up monitoring for:

- Smart contract events
- Transaction failures
- Backend API health
- Frontend uptime
- Gas price alerts
- Security alerts

Tools:
- Tenderly for smart contract monitoring
- Sentry for error tracking
- Google Analytics for usage
- Uptime Robot for availability

---

## 🔐 Security Best Practices

### Smart Contracts

1. **Access Control**: Ensure only authorized addresses can call admin functions
2. **Reentrancy Protection**: Use OpenZeppelin's ReentrancyGuard
3. **Integer Overflow**: Use Solidity 0.8+ built-in checks
4. **Gas Optimization**: Minimize storage operations
5. **Emergency Stop**: Implement pause functionality

### Backend

1. **Environment Variables**: Never commit secrets
2. **Rate Limiting**: Prevent API abuse
3. **Input Validation**: Sanitize all user inputs
4. **HTTPS Only**: Enforce SSL/TLS
5. **CORS**: Restrict to your frontend domain
6. **Authentication**: Implement JWT or session-based auth
7. **Logging**: Log all important actions

### Frontend

1. **Environment Variables**: Use VITE_ prefix for public vars
2. **Input Validation**: Validate on client and server
3. **XSS Protection**: Sanitize user-generated content
4. **HTTPS**: Always use secure connections
5. **Wallet Security**: Never request private keys

### Firebase

1. **Security Rules**: Implement proper Firestore rules
2. **Storage Rules**: Restrict file uploads
3. **Authentication**: Enable required auth methods only
4. **Backup**: Regular database backups
5. **Monitoring**: Enable Firebase monitoring

---

## 📊 Cost Estimation

### Testnet (Free)
- Smart Contract Deployment: Free (testnet ETH)
- Frontend Hosting: Free (Vercel/Netlify free tier)
- Backend Hosting: Free (Railway/Render free tier)
- Firebase: Free (Spark plan)

### Mainnet (Approximate)
- Smart Contract Deployment: 0.1-0.5 ETH (~$200-$1000)
- Frontend Hosting: $0-20/month
- Backend Hosting: $7-25/month
- Firebase: $0-25/month (Blaze plan, pay-as-you-go)
- Domain: $10-15/year
- SSL Certificate: Free (Let's Encrypt)

**Total Monthly Cost**: $7-70/month (after initial deployment)

---

## 🆘 Troubleshooting

### Deployment Fails

**Error**: "Insufficient funds"
- **Solution**: Add more ETH to deployment wallet

**Error**: "Nonce too high"
- **Solution**: Reset MetaMask account or wait for pending transactions

**Error**: "Gas estimation failed"
- **Solution**: Check contract code for errors, increase gas limit

### Frontend Issues

**Error**: "Contract not found"
- **Solution**: Verify contract address in .env file

**Error**: "Wrong network"
- **Solution**: Switch MetaMask to correct network

### Backend Issues

**Error**: "Port already in use"
- **Solution**: Change PORT in .env or kill existing process

**Error**: "Firebase permission denied"
- **Solution**: Update Firebase security rules

---

## 📞 Support

For deployment support:
- Open an issue on GitHub
- Email: support@kwote.io
- Discord: [Join our server]

---

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] Test all features on production
- [ ] Verify smart contract on Etherscan
- [ ] Set up monitoring and alerts
- [ ] Document contract addresses
- [ ] Create admin accounts
- [ ] Test emergency procedures
- [ ] Announce launch to users
- [ ] Monitor for first 24 hours

---

**Congratulations on deploying KWOTE! 🎉**
