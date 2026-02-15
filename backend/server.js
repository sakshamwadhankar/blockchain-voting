require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// ── Mock Employee Database ──────────────────────────────
// Check if file exists, else use empty array or basic mock
let employees = [];
try {
    const dataPath = path.join(__dirname, 'data', 'employees.json');
    if (fs.existsSync(dataPath)) {
        employees = require('./data/employees.json');
    } else {
        console.warn("⚠️ data/employees.json not found. Using empty database.");
        // Fallback or ensure directory exists
        if (!fs.existsSync(path.join(__dirname, 'data'))) {
            fs.mkdirSync(path.join(__dirname, 'data'));
        }
    }
} catch (err) {
    console.error("Error loading employees:", err);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(bodyParser.json());

// ── Twilio Setup ────────────────────────────────────────
let twilioClient;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_sid') {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } else {
        console.warn("⚠️ Twilio credentials missing or invalid. OTP might fail unless bypassed.");
    }
} catch (error) {
    console.error("⚠️ Failed to initialize Twilio:", error.message);
}

// ── Blockchain Setup ────────────────────────────────────
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const ELECTION_MANAGER_ADDRESS = process.env.ELECTION_MANAGER_ADDRESS;

if (!PRIVATE_KEY || !ELECTION_MANAGER_ADDRESS) {
    console.error("❌ MISSING ENV: ADMIN_PRIVATE_KEY or ELECTION_MANAGER_ADDRESS");
}

const ELECTION_MANAGER_ABI = [
    "function createElection(string position, uint256 durationInDays) external returns (uint256)",
    "function addCandidate(uint256 electionId, string name, string employeeId, string department, string manifestoIPFS) external",
    "function issueVoterToken(string corporateId, string mfaCode) external returns (bytes32)",
    "function castVote(uint256 electionId, uint256 candidateId, bytes32 corporateId, bytes32 voterToken) external",
    "function finalizeElection(uint256 electionId) external",
    "function getElection(uint256 electionId) external view returns (string position, uint256 startTime, uint256 endTime, bool isActive, bool resultsPublished, uint256 totalVotes, uint256 candidateCount)",
    "function getCandidate(uint256 electionId, uint256 candidateId) external view returns (string name, string employeeId, string department, string manifestoIPFS, uint256 voteCount, bool isActive)",
    "function getWinningCandidate(uint256 electionId) public view returns (uint256)",
    "function hasVotedInElection(uint256 electionId, bytes32 corporateIdHash) external view returns (bool)",
    "function getAuditTrailLength() external view returns (uint256)",
    "function getAuditRecord(uint256 index) external view returns (uint256 electionId, uint256 timestamp, bytes32 voterHash, bool verified)",
    "function nextElectionId() public view returns (uint256)",
    "event ElectionCreated(uint256 indexed electionId, string position, uint256 startTime, uint256 endTime)",
    "event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name, string employeeId)",
    "event VoteCast(uint256 indexed electionId, bytes32 indexed voterHash, uint256 timestamp)",
    "event ElectionFinalized(uint256 indexed electionId, uint256 winningCandidateId, uint256 totalVotes)"
];

let provider;
let wallet;
let electionManager;

async function initBlockchain() {
    try {
        provider = new ethers.JsonRpcProvider(RPC_URL);
        wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        electionManager = new ethers.Contract(ELECTION_MANAGER_ADDRESS, ELECTION_MANAGER_ABI, wallet);
        console.log("✅ Connected to Blockchain:", RPC_URL);
        console.log("✅ Election Manager:", ELECTION_MANAGER_ADDRESS);

        // Setup Event Listeners
        setupEventListeners();
    } catch (error) {
        console.error("❌ Blockchain Connection Failed:", error);
    }
}

function setupEventListeners() {
    if (!electionManager) return;

    electionManager.on("ElectionCreated", (id, position, start, end) => {
        console.log(`New Election: ${id} - ${position}`);
        io.emit("newElection", {
            id: id.toString(),
            position,
            startTime: start.toString(),
            endTime: end.toString()
        });
    });

    electionManager.on("VoteCast", (electionId, voterHash, timestamp) => {
        console.log(`Vote Cast in Election ${electionId}`);
        io.emit("newVote", {
            electionId: electionId.toString(),
            voterHash,
            timestamp: timestamp.toString()
        });
    });

    electionManager.on("ElectionFinalized", (electionId, winnerId, totalVotes) => {
        console.log(`Election ${electionId} Finalized`);
        io.emit("electionFinalized", {
            electionId: electionId.toString(),
            winnerId: winnerId.toString(),
            totalVotes: totalVotes.toString()
        });
    });
}

initBlockchain();

// ── Sybil Protection (employeeId → wallet) ──────────────
const verifiedEmployees = {}; // employeeId → walletAddress

// ── Helper: find employee by ID ─────────────────────────
function findEmployee(employeeId) {
    return employees.find(e => e.employeeId === employeeId) || null;
}

// ── Helper: Calculate Euclidean Distance ────────────────
function getEuclideanDistance(descriptor1, descriptor2) {
    if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
        throw new Error('Invalid descriptors for comparison');
    }
    return Math.sqrt(
        descriptor1
            .map((val, i) => val - descriptor2[i])
            .reduce((sum, diff) => sum + diff * diff, 0)
    );
}

// ── REST Endpoints ──────────────────────────────────────

// 1. Send OTP
app.post('/send-otp', async (req, res) => {
    const { employeeId } = req.body;

    if (!employeeId) {
        return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const employee = findEmployee(employeeId);
    if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found in database' });
    }

    try {
        console.log('[OTP Send] Sending to:', employee.phone);

        let status = 'pending';
        // Only attempt Twilio if configured
        if (twilioClient && verifyServiceSid) {
            const verification = await twilioClient.verify.v2.services(verifyServiceSid)
                .verifications
                .create({ to: employee.phone, channel: 'sms' });
            status = verification.status;
        } else {
            console.log("Mock OTP sent (Twilio disabled)");
            status = 'sent (mock)';
        }

        const maskedPhone = employee.phone.replace(/(\+\d{2})\d{6}(\d{4})/, '$1******$2');

        res.status(200).json({
            success: true,
            message: `OTP sent to ${maskedPhone}`,
            status: status,
            employeeName: employee.name,
            maskedPhone: maskedPhone
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Verify OTP & Issue Token
app.post('/verify-otp', async (req, res) => {
    const { employeeId, code } = req.body;

    if (!employeeId || !code) {
        return res.status(400).json({ success: false, message: 'employeeId and code are required' });
    }

    const employee = findEmployee(employeeId);
    if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    try {
        // Mock Verification
        let isVerified = false;
        if (code.trim() === '123456') {
            console.log('[OTP Verify] Using test OTP bypass');
            isVerified = true;
        } else if (twilioClient && verifyServiceSid) {
            const check = await twilioClient.verify.v2.services(verifyServiceSid)
                .verificationChecks.create({ to: employee.phone, code: code.toString().trim() });
            isVerified = (check.status === 'approved');
        } else {
            return res.status(500).json({ success: false, message: 'Twilio not configured and code is not mock code.' });
        }

        if (!isVerified) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // OTP Verified. Issue Token via Blockchain.
        console.log(`Issuing token for ${employeeId}...`);

        // 1. Simulate to get the token (staticCall)
        // Note: issueVoterToken(string corporateId, string mfaCode)
        // Ideally we pass the hash of mfaCode or something secure, but for prototype we pass code.
        const voterToken = await electionManager.issueVoterToken.staticCall(employeeId, code);
        console.log("Generated Token (StaticCall):", voterToken);

        // 2. Execute transaction to record issuance (state change)
        const tx = await electionManager.issueVoterToken(employeeId, code);
        console.log("Transaction sent:", tx.hash);

        // Wait for confirmation
        await tx.wait();
        console.log("Transaction confirmed");

        res.json({
            success: true,
            message: "Identity Verified & Token Issued",
            voterToken: voterToken,
            txHash: tx.hash,
            employeeName: employee.name
        });

    } catch (error) {
        console.error("Verification/Blockchain Error:", error);
        res.status(500).json({ success: false, message: "Verification failed", error: error.message });
    }
});

// 3. Verify Biometric
app.post('/verify-biometric', async (req, res) => {
    const { employeeId, faceDescriptor } = req.body;

    if (!employeeId || !faceDescriptor) {
        return res.status(400).json({ success: false, message: 'employeeId and faceDescriptor are required' });
    }

    const employee = findEmployee(employeeId);
    if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    try {
        // Scenario A: Registration
        if (!employee.faceDescriptor || employee.faceDescriptor === null) {
            employee.faceDescriptor = faceDescriptor;

            // Persist
            const filePath = path.join(__dirname, 'data', 'employees.json');
            fs.writeFileSync(filePath, JSON.stringify(employees, null, 4));

            return res.status(200).json({
                success: true,
                message: 'Face registered successfully!',
                employeeName: employee.name,
                isRegistration: true
            });
        }

        // Scenario B: Verification
        const distance = getEuclideanDistance(employee.faceDescriptor, faceDescriptor);
        console.log(`[Face Verification] ${employeeId} - Distance: ${distance.toFixed(4)}`);

        const THRESHOLD = 0.5;

        if (distance < THRESHOLD) {
            return res.status(200).json({
                success: true,
                message: `Face verified! Match: ${((1 - distance) * 100).toFixed(1)}%`,
                employeeName: employee.name,
                distance: distance.toFixed(4),
                isRegistration: false
            });
        } else {
            return res.status(403).json({
                success: false,
                message: 'Face does not match records.',
                distance: distance.toFixed(4)
            });
        }
    } catch (error) {
        console.error('Biometric Error:', error);
        res.status(500).json({ success: false, message: `Biometric failed: ${error.message}` });
    }
});

// 4. Employee Lookup
app.get('/employee/:id', (req, res) => {
    const employee = findEmployee(req.params.id);
    if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.status(200).json({
        success: true,
        data: {
            employeeId: employee.employeeId,
            name: employee.name,
            hasWallet: !!employee.wallet,
            hasFaceData: employee.faceDescriptor !== null
        }
    });
});

// 5. Results (Proxy for ElectionManager)
app.get('/results/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const election = await electionManager.getElection(id);

        let inferredState = "Unknown";
        if (election.isActive) inferredState = "Active";
        else if (election.resultsPublished) inferredState = "Finalized";
        else inferredState = "Pending";

        res.status(200).json({
            success: true,
            data: {
                id: id,
                position: election.position,
                startTime: election.startTime.toString(),
                endTime: election.endTime.toString(),
                totalVotes: election.totalVotes.toString(),
                candidateCount: election.candidateCount.toString(),
                state: inferredState,
                resultsPublished: election.resultsPublished
            }
        });
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ success: false, message: "Election not found" });
    }
});

// 6. Analytics
app.get('/analytics/voters', (req, res) => {
    try {
        const totalEmployees = employees.length;
        // Mock verification count based on some criteria, or just total in DB
        const verifiedCount = employees.filter(e => e.faceDescriptor).length;

        res.status(200).json({
            success: true,
            data: {
                totalEmployees,
                verifiedCount,
                unverifiedCount: totalEmployees - verifiedCount,
                verificationRate: totalEmployees > 0 ? ((verifiedCount / totalEmployees) * 100).toFixed(1) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`\n🔹 Election Manager Address: ${ELECTION_MANAGER_ADDRESS}`);
    // console.log(`🔹 Backend Wallet Address:   ${wallet.address}\n`); // wallet might not be available here depending on scope, let's just log address
});
