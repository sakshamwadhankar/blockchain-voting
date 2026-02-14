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
const employees = require('./data/employees.json');

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
        console.warn("⚠️ Twilio credentials missing or invalid. OTP will fail.");
    }
} catch (error) {
    console.error("⚠️ Failed to initialize Twilio:", error.message);
}

// ── Blockchain Setup (Oracle Backend) ───────────────────
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
// Convert to proper checksum format
const governanceAddress = ethers.getAddress(process.env.GOVERNANCE_CONTRACT_ADDRESS.toLowerCase());

const governanceAbi = [
    "function verifyVoter(address _voter) external",
    "function execute(uint256 id) external",
    "function getProposal(uint256 id) external view returns (address proposer, string description, address recipient, uint256 amount, uint256 forVotes, uint256 againstVotes, uint256 startTime, uint256 endTime, bool executed, bool cancelled)",
    "function state(uint256 id) public view returns (uint8)",
    "event Voted(uint256 indexed id, address indexed voter, bool support, uint256 weight)",
    "event ProposalCreated(uint256 indexed id, address indexed proposer, string description, address recipient, uint256 amount)",
    "event ProposalExecuted(uint256 indexed id)"
];

const governanceContract = new ethers.Contract(governanceAddress, governanceAbi, wallet);

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

// ── Real-Time Event Listeners ───────────────────────────

governanceContract.on("ProposalCreated", (id, proposer, description) => {
    console.log(`New Proposal: ${id} by ${proposer}`);
    io.emit("newProposal", {
        id: id.toString(),
        proposer: proposer,
        description: description,
        timestamp: new Date().toISOString()
    });
});

governanceContract.on("Voted", (id, voter, support, weight) => {
    console.log(`New Vote on Proposal ${id}: ${support ? 'FOR' : 'AGAINST'} by ${voter}`);
    io.emit("newVote", {
        proposalId: id.toString(),
        voter: `${voter.substring(0, 6)}...${voter.substring(38)}`,
        support: support,
        weight: weight.toString(),
        timestamp: new Date().toISOString()
    });
});

// ── REST Endpoints ──────────────────────────────────────

// 1. Send OTP — accepts employeeId, looks up phone from database
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
        console.log('[OTP Send] Sending to:', employee.phone, 'Service:', verifyServiceSid);
        
        const verification = await twilioClient.verify.v2.services(verifyServiceSid)
            .verifications
            .create({ to: employee.phone, channel: 'sms' });

        console.log('[OTP Send] Success! Status:', verification.status);

        // Return masked phone for UI display (don't reveal full number)
        const maskedPhone = employee.phone.replace(/(\+\d{2})\d{6}(\d{4})/, '$1******$2');

        res.status(200).json({
            success: true,
            message: `OTP sent to ${maskedPhone}`,
            status: verification.status,
            employeeName: employee.name,
            maskedPhone: maskedPhone
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Verify OTP & Authorize Voter — uses employeeId to look up phone
app.post('/verify-otp', async (req, res) => {
    const { employeeId, code, walletAddress } = req.body;

    if (!employeeId || !code || !walletAddress) {
        return res.status(400).json({ success: false, message: 'employeeId, code, and walletAddress are required' });
    }

    const employee = findEmployee(employeeId);
    if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Sybil check: prevent double-registration
    // Dynamic Wallet Binding & Sybil Protection
    if (!employee.wallet) {
        // First-time bind
        employee.wallet = walletAddress;
        console.log(`[Auto-Bind] Linked wallet ${walletAddress} to employee ${employeeId}`);

        // Persist to JSON file
        try {
            const filePath = path.join(__dirname, 'data', 'employees.json');
            fs.writeFileSync(filePath, JSON.stringify(employees, null, 4));
            console.log("[Auto-Bind] Persisted to employees.json");
        } catch (err) {
            console.error("[Auto-Bind] Failed to save database:", err);
        }
    } else if (employee.wallet.toLowerCase() !== walletAddress.toLowerCase()) {
        // Mismatch - Block request
        return res.status(403).json({
            success: false,
            message: `Sybil Protection: This ID is bound to another wallet (${employee.wallet.substring(0, 6)}...)`
        });
    }

    try {
        // Test/Development Mode: Accept 123456 as bypass OTP
        if (code.trim() === '123456') {
            console.log('[OTP Verify] Using test OTP bypass for development');
            
            // On-chain authorization
            const tx = await governanceContract.verifyVoter(walletAddress);
            await tx.wait();

            verifiedEmployees[employeeId] = walletAddress;

            return res.status(200).json({
                success: true,
                message: 'Voter verified and authorized on-chain (Test Mode)',
                transactionHash: tx.hash,
                employeeName: employee.name,
                testMode: true
            });
        }

        // Real Twilio verification
        const verificationCheck = await twilioClient.verify.v2
            .services(verifyServiceSid)
            .verificationChecks
            .create({ 
                to: employee.phone, 
                code: code.toString().trim()
            });

        console.log('[OTP Verify] Status:', verificationCheck.status);

        if (verificationCheck.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // On-chain authorization
        const tx = await governanceContract.verifyVoter(walletAddress);
        await tx.wait();

        verifiedEmployees[employeeId] = walletAddress;

        res.status(200).json({
            success: true,
            message: 'Voter verified and authorized on-chain',
            transactionHash: tx.hash,
            employeeName: employee.name
        });
    } catch (error) {
        console.error('Error in verification flow:', error);
        console.error('Error details:', {
            code: error.code,
            status: error.status,
            message: error.message,
            moreInfo: error.moreInfo
        });
        
        // If Twilio verification fails but we want to proceed anyway (for testing)
        if (error.code === 20404) {
            console.warn('[OTP Verify] Twilio service not found - attempting blockchain verification anyway');
            try {
                const tx = await governanceContract.verifyVoter(walletAddress);
                await tx.wait();
                
                verifiedEmployees[employeeId] = walletAddress;
                
                return res.status(200).json({
                    success: true,
                    message: 'Voter authorized on-chain (OTP verification skipped)',
                    transactionHash: tx.hash,
                    employeeName: employee.name,
                    warning: 'Twilio OTP verification was skipped'
                });
            } catch (blockchainError) {
                return res.status(500).json({ 
                    success: false, 
                    message: `Blockchain error: ${blockchainError.message}`
                });
            }
        }
        
        res.status(500).json({ 
            success: false, 
            message: `Verification failed: ${error.message}`,
            errorCode: error.code 
        });
    }
});

// 3. Verify Biometric (Face Recognition with Database Comparison)
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
        // Scenario A: First Time Registration (No face data stored)
        if (!employee.faceDescriptor || employee.faceDescriptor === null) {
            employee.faceDescriptor = faceDescriptor;
            
            // Persist to JSON file
            const filePath = path.join(__dirname, 'data', 'employees.json');
            fs.writeFileSync(filePath, JSON.stringify(employees, null, 4));
            
            console.log(`[Face Registration] Registered face for employee ${employeeId}`);
            
            return res.status(200).json({
                success: true,
                message: 'Face registered successfully!',
                employeeName: employee.name,
                isRegistration: true
            });
        }

        // Scenario B: Verification (Compare with stored face)
        const storedDescriptor = employee.faceDescriptor;
        const distance = getEuclideanDistance(storedDescriptor, faceDescriptor);
        
        console.log(`[Face Verification] Employee ${employeeId} - Distance: ${distance.toFixed(4)}`);

        const THRESHOLD = 0.5; // Lower = stricter matching
        
        if (distance < THRESHOLD) {
            // Face matches!
            return res.status(200).json({
                success: true,
                message: `Face verified! Match confidence: ${((1 - distance) * 100).toFixed(1)}%`,
                employeeName: employee.name,
                distance: distance.toFixed(4),
                isRegistration: false
            });
        } else {
            // Face does not match
            return res.status(403).json({
                success: false,
                message: 'Face does not match records. Please try again or contact admin.',
                distance: distance.toFixed(4)
            });
        }
    } catch (error) {
        console.error('Error in biometric verification:', error);
        return res.status(500).json({ 
            success: false, 
            message: `Biometric verification failed: ${error.message}` 
        });
    }
});

// 4. GET Employee lookup (for frontend to check if ID exists)
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

// 5. POST Register New Employee
app.post('/register-employee', async (req, res) => {
    const { employeeId, name, phone, faceDescriptor } = req.body;

    if (!employeeId || !name || !phone || !faceDescriptor) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required: employeeId, name, phone, faceDescriptor' 
        });
    }

    // Check if employee ID already exists
    const existingEmployee = findEmployee(employeeId);
    if (existingEmployee) {
        return res.status(409).json({ 
            success: false, 
            message: `Employee ID ${employeeId} already exists` 
        });
    }

    try {
        // Create new employee object
        const newEmployee = {
            employeeId: employeeId.trim().toUpperCase(),
            name: name.trim(),
            phone: phone.trim(),
            wallet: null,
            faceDescriptor: faceDescriptor
        };

        // Add to employees array
        employees.push(newEmployee);

        // Persist to JSON file
        const filePath = path.join(__dirname, 'data', 'employees.json');
        fs.writeFileSync(filePath, JSON.stringify(employees, null, 4));

        console.log(`[Employee Registration] New employee registered: ${employeeId} - ${name}`);

        res.status(201).json({
            success: true,
            message: 'Employee registered successfully',
            employeeId: newEmployee.employeeId,
            name: newEmployee.name
        });
    } catch (error) {
        console.error('Error registering employee:', error);
        res.status(500).json({ 
            success: false, 
            message: `Registration failed: ${error.message}` 
        });
    }
});

// 6. GET Live Results Snapshot
app.get('/results/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const proposal = await governanceContract.getProposal(id);
        const proposalState = await governanceContract.state(id);

        const stateLabels = ["Pending", "Active", "Succeeded", "Defeated", "Executed", "Cancelled"];

        res.status(200).json({
            success: true,
            data: {
                id: id,
                proposer: proposal.proposer,
                description: proposal.description,
                forVotes: proposal.forVotes.toString(),
                againstVotes: proposal.againstVotes.toString(),
                startTime: proposal.startTime.toString(),
                endTime: proposal.endTime.toString(),
                executed: proposal.executed,
                cancelled: proposal.cancelled,
                state: stateLabels[proposalState] || "Unknown"
            }
        });
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ success: false, message: "Proposal not found or contract error" });
    }
});

// 7. GET Analytics - Voter Registry and Statistics
app.get('/analytics/voters', (req, res) => {
    try {
        const totalEmployees = employees.length;
        const verifiedCount = employees.filter(e => e.wallet !== null).length;
        
        const registry = employees.map(e => ({
            employeeId: e.employeeId,
            name: e.name,
            isVerified: e.wallet !== null,
            hasFaceData: e.faceDescriptor !== null
        }));

        res.status(200).json({
            success: true,
            data: {
                totalEmployees,
                verifiedCount,
                unverifiedCount: totalEmployees - verifiedCount,
                verificationRate: totalEmployees > 0 ? ((verifiedCount / totalEmployees) * 100).toFixed(1) : 0,
                registry
            }
        });
    } catch (error) {
        console.error('Error fetching voter analytics:', error);
        res.status(500).json({ 
            success: false, 
            message: `Analytics error: ${error.message}` 
        });
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Oracle & Streaming server running on port ${PORT}`);
    console.log(`Loaded ${employees.length} employees from mock database`);

    // Environment Check
    if (!process.env.RPC_URL || !process.env.ADMIN_PRIVATE_KEY || !process.env.GOVERNANCE_CONTRACT_ADDRESS) {
        console.error("❌ MISSING ENV VARIABLES: Check RPC_URL, ADMIN_PRIVATE_KEY, and GOVERNANCE_CONTRACT_ADDRESS");
    } else {
        console.log("✅ Blockchain configuration loaded");
    }
});
