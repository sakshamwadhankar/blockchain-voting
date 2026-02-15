/**
 * Migrate Employee Data from JSON to Firebase
 * 
 * This script migrates existing employee data from backend/data/employees.json
 * to Firebase Firestore
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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

async function migrateEmployees() {
  console.log('🔥 Starting Firebase Migration...\n');

  try {
    // Read employees.json
    const employeesPath = path.join(__dirname, '../backend/data/employees.json');
    const employeesData = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));

    console.log(`📊 Found ${Object.keys(employeesData).length} employees to migrate\n`);

    let successCount = 0;
    let errorCount = 0;

    // Migrate each employee
    for (const [employeeId, employee] of Object.entries(employeesData)) {
      try {
        console.log(`Migrating: ${employeeId} - ${employee.name}`);

        // Create Firestore document
        const employeeRef = doc(db, 'employees', employeeId);
        
        await setDoc(employeeRef, {
          employeeId: employee.id,
          fullName: employee.name,
          department: employee.department || 'Not Specified',
          email: employee.email || `${employee.id}@company.com`,
          phone: employee.phone || '+1234567890',
          position: employee.position || 'Employee',
          faceDescriptor: employee.faceDescriptor || [],
          walletAddress: employee.authorizedWallet || null,
          isVerified: employee.isVerified || false,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log(`  ✅ Migrated successfully`);
        successCount++;

      } catch (error) {
        console.error(`  ❌ Error migrating ${employeeId}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📦 Total: ${successCount + errorCount}`);
    console.log('='.repeat(60));

    if (successCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
      console.log('2. Navigate to Firestore Database');
      console.log('3. Check the "employees" collection');
      console.log('4. Verify all employee data is present');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run migration
migrateEmployees();
