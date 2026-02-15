const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Path to your service account key
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('ERROR: Service account key not found!');
    console.error('Please download your service account key from Firebase Console -> Project Settings -> Service accounts');
    console.error('Rename it to "serviceAccountKey.json" and place it in the "scripts" directory.');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedData() {
    try {
        console.log('Starting Firestore seeding...');

        // 1. Seed Employees
        console.log('Seeding employees...');
        const employeesRef = db.collection('employees');
        await employeesRef.doc('MNC-001').set({
            employeeId: "MNC-001",
            fullName: "John Doe",
            department: "Engineering",
            email: "john@company.com",
            phone: "+1234567890",
            faceDescriptor: [], // Empty for now, to be populated by frontend
            walletAddress: null,
            isVerified: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Seed Elections Metadata
        console.log('Seeding elections metadata...');
        const electionsRef = db.collection('elections_metadata');
        await electionsRef.doc('0').set({
            electionId: 0,
            title: "CEO Election 2024",
            description: "Annual CEO election to decide the future leadership of the company.",
            bannerUrl: "https://via.placeholder.com/800x400?text=Election+Banner", // Placeholder
            rules: "One vote per verified employee. Voting remains open for 7 days.",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 3. Seed Candidates (Sub-collection example in guide, but usually top-level or sub-collection)
        // The guide had: /elections_metadata/{electionId}/candidates/{candidateId}
        console.log('Seeding candidates...');
        await electionsRef.doc('0').collection('candidates').doc('1').set({
            candidateId: 1,
            name: "Alice Johnson",
            bio: "Visionary leader with 15 years of experience in tech innovation.",
            photoUrl: "https://via.placeholder.com/200x200?text=Alice",
            manifestoUrl: "https://example.com/manifesto.pdf"
        });

        await electionsRef.doc('0').collection('candidates').doc('2').set({
            candidateId: 2,
            name: "Bob Smith",
            bio: "Operational expert focused on efficiency and sustainable growth.",
            photoUrl: "https://via.placeholder.com/200x200?text=Bob",
            manifestoUrl: "https://example.com/manifesto.pdf"
        });

        console.log('Seeding complete! ✅');
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        process.exit();
    }
}

seedData();
