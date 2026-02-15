# 🚀 Quick Deployment Guide - Election System

## Complete Setup in 5 Minutes

---

## Step 1: Start Blockchain Node

Open a new terminal and run:

```bash
npx hardhat node
```

Keep this terminal running. You should see 20 test accounts with ETH.

---

## Step 2: Deploy Smart Contracts

Open another terminal and deploy:

```bash
npx hardhat run scripts/deploy-election.js --network localhost
```

You should see output like:
```
✅ ElectionManager deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
📝 Deployment info saved to deployments/election-localhost.json
```

---

## Step 3: Start Backend (Optional for MFA)

```bash
cd backend
npm start
```

Backend runs on http://localhost:5000

---

## Step 4: Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on http://localhost:5173

---

## Step 5: Connect MetaMask

1. Open MetaMask
2. Add Network:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency: ETH

3. Import Test Account:
   - Copy private key from hardhat node terminal
   - Import into MetaMask

---

## Step 6: Create Your First Election

1. Navigate to http://localhost:5173/election-admin
2. Click "Create Election" tab
3. Fill in:
   - Position: "CEO 2024"
   - Duration: 7 days
4. Click "Create Election"
5. Approve MetaMask transaction

---

## Step 7: Add Candidates

1. Stay on Election Admin page
2. Click "Add Candidates" tab
3. Select your election
4. Add candidate details:
   ```
   Name: John Doe
   Employee ID: EMP-001
   Department: Engineering
   Manifesto IPFS: (leave empty for now)
   ```
5. Repeat for 2-3 more candidates

---

## Step 8: View Dashboard

Navigate to http://localhost:5173/elections

You should see:
- Your election listed
- All candidates
- Vote counts (currently 0)
- Empty audit trail

---

## Step 9: Cast a Vote

1. Navigate to http://localhost:5173/cast-vote
2. Select your election
3. Enter:
   - Corporate ID: EMP-TEST-001
   - MFA Code: 123456
4. Click "Request Voter Token"
5. For testing, use any bytes32 value as token:
   ```
   0x1234567890123456789012345678901234567890123456789012345678901234
   ```
6. Select a candidate
7. Click "Cast Vote"
8. Approve MetaMask transaction

---

## Step 10: Watch Live Updates

Go back to http://localhost:5173/elections

You should see:
- Vote count increased
- Charts updated
- New entry in audit trail
- Live update notification

---

## 🎉 Success!

You now have a fully functional election system!

---

## Testing Checklist

- [ ] Create election
- [ ] Add 3+ candidates
- [ ] Cast vote from Account 1
- [ ] Switch MetaMask account
- [ ] Cast vote from Account 2
- [ ] View updated charts
- [ ] Check audit trail
- [ ] Try voting twice (should fail)
- [ ] Wait for election to end
- [ ] Finalize election
- [ ] View published results

---

## Common Issues

### Issue: "Cannot connect to blockchain"
**Solution**: Make sure `npx hardhat node` is running

### Issue: "Transaction failed"
**Solution**: 
- Check you have ETH in MetaMask
- Verify contract address in deployment file
- Reset MetaMask account (Settings → Advanced → Reset Account)

### Issue: "Already voted"
**Solution**: Use a different MetaMask account or Corporate ID

### Issue: "Invalid voter token"
**Solution**: 
- For testing, admin must call `issueVoterToken()` first
- Or use the backend MFA service

---

## Production Deployment

### 1. Deploy to Testnet (Sepolia)

```bash
# Add to hardhat.config.js
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  }
}

# Deploy
npx hardhat run scripts/deploy-election.js --network sepolia
```

### 2. Verify Contract

```bash
npx hardhat verify --network sepolia DEPLOYED_ADDRESS "CONSTRUCTOR_ARGS"
```

### 3. Update Frontend Config

```javascript
// frontend/src/services/electionService.js
const ELECTION_MANAGER_ADDRESS = "0xYourSepoliaAddress";
```

### 4. Deploy Frontend

```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel/Netlify
```

---

## Advanced Features

### IPFS Integration

```bash
# Install IPFS
npm install ipfs-http-client

# Upload manifesto
const ipfs = create({ url: 'https://ipfs.infura.io:5001' });
const { cid } = await ipfs.add(file);
// Use cid.toString() as manifestoIPFS
```

### MFA Backend

```javascript
// backend/routes/mfa.js
app.post('/api/request-token', async (req, res) => {
  const { corporateId, mfaCode } = req.body;
  
  // Verify MFA with authenticator
  const isValid = await verifyMFA(corporateId, mfaCode);
  
  if (isValid) {
    // Call smart contract
    const token = await electionManager.issueVoterToken(corporateId, mfaCode);
    
    // Send token via email/SMS
    await sendToken(corporateId, token);
    
    res.json({ success: true });
  }
});
```

---

## Performance Tips

1. **Batch Operations**: Add multiple candidates in one transaction
2. **Gas Optimization**: Use `calldata` instead of `memory` for strings
3. **Caching**: Cache election data in frontend to reduce RPC calls
4. **Indexing**: Use The Graph for faster queries

---

## Security Checklist

- [ ] Audit smart contracts
- [ ] Use multi-sig for admin functions
- [ ] Implement rate limiting
- [ ] Secure MFA token delivery
- [ ] Monitor for suspicious activity
- [ ] Set up emergency pause
- [ ] Backup private keys securely
- [ ] Test double-voting prevention
- [ ] Verify privacy guarantees
- [ ] Document all admin actions

---

## Support

For issues or questions:
1. Check console logs in browser DevTools
2. Check hardhat node terminal for errors
3. Verify MetaMask network and account
4. Review smart contract events

---

**Happy Voting! 🗳️**
