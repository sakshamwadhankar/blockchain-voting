# 🔄 Data Clear Karne Ka Guide

## Problem
Firebase mein data nahi hai lekin purana blockchain data dikh raha hai.

## Solution - 3 Steps

### Step 1: Browser Data Clear Karein
```
1. Browser console kholen (F12)
2. Application/Storage tab mein jaayein
3. "Clear site data" button click karein
   YA
   Console mein type karein:
   localStorage.clear()
   sessionStorage.clear()
```

### Step 2: Blockchain Node Restart Karein
```bash
# Purana node band karein (Ctrl+C)
# Naya node start karein
npx hardhat node
```

### Step 3: Contract Redeploy Karein
```bash
# Naye blockchain par contract deploy karein
npx hardhat run scripts/test-election-system.js --network localhost
```

### Step 4: MetaMask Reset (Optional)
```
1. MetaMask kholen
2. Settings → Advanced
3. "Reset Account" click karein
4. Confirm karein
```

### Step 5: Frontend Restart
```bash
cd frontend
npm run dev
```

## Quick Reset Script
Yeh sab ek saath karne ke liye:

```bash
# Terminal 1 - Blockchain restart
npx hardhat node

# Terminal 2 - Deploy
npx hardhat run scripts/test-election-system.js --network localhost

# Terminal 3 - Frontend
cd frontend
npm run dev
```

## Verification
- Browser console mein errors nahi hone chahiye
- Election list khali honi chahiye
- Candidates list khali honi chahiye

---

**Note**: Blockchain data permanent nahi hai local node par. Har restart par fresh state milta hai.
