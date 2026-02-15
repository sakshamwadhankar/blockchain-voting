# 🔥 Firebase Integration Setup Guide

## Complete Guide to Setting Up Firebase for MNC Voting System

---

## 📋 Prerequisites

- Firebase account (free tier works)
- Node.js 18+ installed
- Existing blockchain voting system

---

## 🚀 Step 1: Create Firebase Project

### 1.1 Go to Firebase Console
Visit: https://console.firebase.google.com/

### 1.2 Create New Project
1. Click "Add project"
2. Enter project name: "mnc-voting-system"
3. Enable Google Analytics (optional)
4. Click "Create project"

### 1.3 Register Web App
1. Click the web icon (</>) in project overview
2. Register app name: "MNC Voting Web"
3. Copy the Firebase configuration object

---

## 🔧 Step 2: Enable Firebase Services

### 2.1 Enable Authentication
1. Go to "Authentication" in left sidebar
2. Click "Get started"
3. Enable "Email/Password" sign-in method
4. (Optional) Enable "Google" sign-in

### 2.2 Enable Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Start in "Test mode" (for development)
4. Choose location (closest to your users)
5. Click "Enable"

### 2.3 Enable Storage
1. Go to "Storage"
2. Click "Get started"
3. Start in "Test mode"
4. Click "Done"

---

## 📦 Step 3: Install Firebase SDK

```bash
cd frontend
npm install firebase
```

---

## 🔑 Step 4: Configure Firebase in Your App

### 4.1 Create .env file
```bash
cd frontend
cp .env.example .env
```

### 4.2 Add Firebase Credentials
Edit `frontend/.env`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=mnc-voting-system.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mnc-voting-system
VITE_FIREBASE_STORAGE_BUCKET=mnc-voting-system.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**Where to find these values:**
- Firebase Console → Project Settings → General → Your apps → SDK setup and configuration

---

## 🗄️ Step 5: Set Up Firestore Collections

### 5.1 Create Collections

Go to Firestore Database and create these collections:

#### Collection: `employees`
```javascript
{
  employeeId: "MNC-001",
  fullName: "John Doe",
  department: "Engineering",
  email: "john@company.com",
  phone: "+1234567890",
  faceDescriptor: [0.123, -0.456, ...], // 128 numbers
  walletAddress: "0xABC...",
  isVerified: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Collection: `elections_metadata`
```javascript
{
  electionId: 0,
  title: "CEO Election 2024",
  description: "Annual CEO election",
  bannerUrl: "https://storage.googleapis.com/...",
  rules: "One vote per employee",
  startDate: "2024-01-01T00:00:00Z",
  endDate: "2024-01-07T23:59:59Z",
  createdAt: timestamp
}
```

#### Collection: `audit_logs`
```javascript
{
  electionId: 0,
  voterHash: "0x1234...",
  candidateId: 2,
  transactionHash: "0xabc...",
  blockNumber: 12345,
  timestamp: 1234567890,
  status: "Success",
  createdAt: timestamp
}
```

### 5.2 Set Up Security Rules

Go to Firestore → Rules and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Employees collection - read only for authenticated users
    match /employees/{employeeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Elections metadata - public read, admin write
    match /elections_metadata/{electionId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
      
      match /candidates/{candidateId} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.token.admin == true;
      }
    }
    
    // Audit logs - public read, system write
    match /audit_logs/{logId} {
      allow read: if true;
      allow create: if request.auth != null;
    }
  }
}
```

### 5.3 Set Up Storage Rules

Go to Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Election banners - public read, admin write
    match /election_banners/{electionId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Candidate photos - public read, admin write
    match /candidate_photos/{electionId}/{candidateId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Manifestos - public read, admin write
    match /manifestos/{electionId}/{candidateId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

---

## 👤 Step 6: Register Test Employee

### 6.1 Using Firebase Console
1. Go to Firestore Database
2. Click "Start collection"
3. Collection ID: `employees`
4. Document ID: `MNC-001`
5. Add fields:
   ```
   employeeId: "MNC-001"
   fullName: "Test User"
   department: "Engineering"
   email: "test@company.com"
   phone: "+1234567890"
   faceDescriptor: [] (empty array for now)
   walletAddress: null
   isVerified: false
   ```

### 6.2 Register Face Descriptor
Use the biometric registration component to capture and save face data.

---

## 🧪 Step 7: Test the Integration

### 7.1 Start the Application
```bash
# Terminal 1: Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy-election.js --network localhost

# Terminal 3: Frontend
cd frontend
npm run dev

# Terminal 4: Backend (if needed)
cd backend
npm start
```

### 7.2 Test Biometric Verification
1. Navigate to verification page
2. Enter employee ID: `MNC-001`
3. Allow camera access
4. Position face in frame
5. Click "Verify Identity"
6. Should match against Firebase data

### 7.3 Test Election Creation
1. Go to Firebase Admin Panel
2. Create election with metadata
3. Upload banner image
4. Verify data in Firestore

### 7.4 Test Candidate Addition
1. Add candidate with photo and manifesto
2. Files should upload to Firebase Storage
3. URLs stored in Firestore
4. Candidate added to blockchain

---

## 📊 Step 8: Monitor and Debug

### 8.1 View Firestore Data
Firebase Console → Firestore Database → View collections

### 8.2 View Storage Files
Firebase Console → Storage → Browse files

### 8.3 Check Authentication
Firebase Console → Authentication → Users

### 8.4 View Logs
Firebase Console → Functions → Logs (if using Cloud Functions)

---

## 🔒 Step 9: Security Best Practices

### 9.1 Environment Variables
- Never commit `.env` file to git
- Use different Firebase projects for dev/prod
- Rotate API keys regularly

### 9.2 Firestore Security
- Update rules to production mode before launch
- Implement proper authentication checks
- Validate data on write operations

### 9.3 Storage Security
- Limit file sizes (max 10MB for images, 50MB for PDFs)
- Validate file types
- Scan uploaded files for malware

---

## 🚀 Step 10: Production Deployment

### 10.1 Update Firestore Rules
Change from test mode to production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 10.2 Enable App Check
1. Go to App Check in Firebase Console
2. Register your app
3. Enable reCAPTCHA v3
4. Add App Check SDK to your app

### 10.3 Set Up Backups
1. Go to Firestore → Backups
2. Enable automated backups
3. Set retention period

---

## 📋 Checklist

Before going live, verify:

- [ ] Firebase project created
- [ ] Authentication enabled
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] Collections created (employees, elections_metadata, audit_logs)
- [ ] Security rules configured
- [ ] Storage rules configured
- [ ] Environment variables set
- [ ] Test employee registered
- [ ] Biometric verification tested
- [ ] Election creation tested
- [ ] Candidate addition tested
- [ ] File uploads working
- [ ] Audit logs recording
- [ ] App Check enabled (production)
- [ ] Backups configured (production)

---

## 🆘 Troubleshooting

### Issue: "Firebase not initialized"
**Solution**: Check that firebaseConfig.js is imported and initialized before use

### Issue: "Permission denied"
**Solution**: Update Firestore security rules to allow the operation

### Issue: "Storage upload failed"
**Solution**: Check Storage rules and file size limits

### Issue: "Face descriptor not saving"
**Solution**: Ensure faceDescriptor is an array of 128 numbers

### Issue: "Cannot read from Firestore"
**Solution**: Verify collection and document IDs are correct

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Storage Guide](https://firebase.google.com/docs/storage)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

---

## 🎯 Next Steps

1. Complete Firebase setup following this guide
2. Test all features thoroughly
3. Migrate existing employee data to Firestore
4. Update frontend components to use Firebase
5. Deploy to production

---

**Your Firebase-powered MNC Voting System is ready!** 🎉
