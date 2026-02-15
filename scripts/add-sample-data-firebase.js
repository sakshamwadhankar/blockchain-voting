/**
 * Add Sample Data to Firebase
 * 
 * This script adds sample employees and election data to Firebase Firestore
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDpfOCtXq5ZrzsMzLbhmpMqj4v62EoO2pQ",
  authDomain: "mnc-voting-system.firebaseapp.com",
  projectId: "mnc-voting-system",
  storageBucket: "mnc-voting-system.firebasestorage.app",
  messagingSenderId: "278632860072",
  appId: "1:278632860072:web:3fb23c4034881a8dc0f59d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample employees data
const sampleEmployees = [
  {
    employeeId: "MNC-001",
    fullName: "Saksham Wadhankar",
    department: "Engineering",
    email: "saksham@company.com",
    phone: "+919876543210",
    position: "Senior Developer",
    faceDescriptor: Array(128).fill(0).map(() => Math.random() * 2 - 1), // Random 128 numbers
    walletAddress: null,
    isVerified: false
  },
  {
    employeeId: "MNC-002",
    fullName: "Aarav Sharma",
    department: "Operations",
    email: "aarav@company.com",
    phone: "+919876543211",
    position: "Operations Manager",
    faceDescriptor: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    walletAddress: null,
    isVerified: false
  },
  {
    employeeId: "MNC-003",
    fullName: "Priya Patel",
    department: "Finance",
    email: "priya@company.com",
    phone: "+919876543212",
    position: "Financial Analyst",
    faceDescriptor: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    walletAddress: null,
    isVerified: false
  },
  {
    employeeId: "MNC-004",
    fullName: "Rahul Verma",
    department: "Marketing",
    email: "rahul@company.com",
    phone: "+919876543213",
    position: "Marketing Head",
    faceDescriptor: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    walletAddress: null,
    isVerified: false
  },
  {
    employeeId: "MNC-005",
    fullName: "Ananya Singh",
    department: "HR",
    email: "ananya@company.com",
    phone: "+919876543214",
    position: "HR Manager",
    faceDescriptor: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    walletAddress: null,
    isVerified: false
  }
];

// Sample election metadata
const sampleElection = {
  electionId: 0,
  title: "CEO Election 2024",
  description: "Annual election for Chief Executive Officer position. All verified employees are eligible to vote.",
  bannerUrl: "",
  rules: "1. One vote per employee\n2. Voting closes at midnight\n3. Results will be announced within 24 hours\n4. All votes are anonymous and secure",
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
};

// Sample candidates
const sampleCandidates = [
  {
    candidateId: 0,
    name: "Alice Johnson",
    bio: "20 years of leadership experience in technology sector. Former VP of Engineering at Fortune 500 company.",
    photoUrl: "",
    manifestoUrl: ""
  },
  {
    candidateId: 1,
    name: "Bob Smith",
    bio: "15 years in operations management. Successfully scaled multiple startups to profitability.",
    photoUrl: "",
    manifestoUrl: ""
  },
  {
    candidateId: 2,
    name: "Carol Williams",
    bio: "Expert in financial strategy with MBA from top business school. 18 years of corporate experience.",
    photoUrl: "",
    manifestoUrl: ""
  }
];

async function addSampleData() {
  console.log('🔥 Adding Sample Data to Firebase...\n');

  try {
    // Add employees
    console.log('👥 Adding sample employees...');
    for (const employee of sampleEmployees) {
      const employeeRef = doc(db, 'employees', employee.employeeId);
      await setDoc(employeeRef, {
        ...employee,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`  ✅ Added: ${employee.fullName} (${employee.employeeId})`);
    }

    // Add election metadata
    console.log('\n🗳️ Adding sample election...');
    const electionRef = doc(db, 'elections_metadata', '0');
    await setDoc(electionRef, {
      ...sampleElection,
      createdAt: new Date()
    });
    console.log(`  ✅ Added: ${sampleElection.title}`);

    // Add candidates
    console.log('\n👤 Adding sample candidates...');
    for (const candidate of sampleCandidates) {
      const candidateRef = doc(db, 'elections_metadata', '0', 'candidates', candidate.candidateId.toString());
      await setDoc(candidateRef, {
        ...candidate,
        createdAt: new Date()
      });
      console.log(`  ✅ Added: ${candidate.name}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Sample Data Added Successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`  Employees: ${sampleEmployees.length}`);
    console.log(`  Elections: 1`);
    console.log(`  Candidates: ${sampleCandidates.length}`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
    console.log('2. Navigate to Firestore Database');
    console.log('3. Check collections:');
    console.log('   - employees (5 documents)');
    console.log('   - elections_metadata (1 document with 3 candidates)');
    console.log('4. Start your app and test the Firebase integration!');

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run
addSampleData();
