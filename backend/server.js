require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const { ethers } = require('ethers');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust for production
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(bodyParser.json());

// Twilio Setup
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// Blockchain Setup (Oracle Backend)
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const governanceAddress = process.env.GOVERNANCE_CONTRACT_ADDRESS;

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

// Mock Database for Sybil Protection
const aadhaarToAddress = {};
const addressToAadhaar = {};

// --- Real-Time Event Listeners ---

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
        voter: `${voter.substring(0, 6)}...${voter.substring(38)}`, // Masked for privacy
        support: support,
        weight: weight.toString(),
        timestamp: new Date().toISOString()
    });
});

// --- REST Endpoints ---

// 1. Send OTP Endpoint
app.post('/send-otp', async (req, res) => {
    const { phoneNumber } = req.body;
    try {
        const verification = await twilioClient.verify.v2.services(verifyServiceSid)
            .verifications
            .create({ to: phoneNumber, channel: 'sms' });

        res.status(200).json({ success: true, message: 'OTP sent successfully', status: verification.status });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Verify OTP & Authorize Voter Endpoint
app.post('/verify-otp', async (req, res) => {
    const { phoneNumber, code, aadhaarId, walletAddress } = req.body;

    try {
        const verificationCheck = await twilioClient.verify.v2.services(verifyServiceSid)
            .verificationChecks
            .create({ to: phoneNumber, code: code });

        if (verificationCheck.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (aadhaarToAddress[aadhaarId] && aadhaarToAddress[aadhaarId] !== walletAddress) {
            return res.status(400).json({ success: false, message: 'This Aadhaar ID is already linked to another wallet.' });
        }

        if (addressToAadhaar[walletAddress] && addressToAadhaar[walletAddress] !== aadhaarId) {
            return res.status(400).json({ success: false, message: 'This wallet is already linked to another Aadhaar.' });
        }

        const tx = await governanceContract.verifyVoter(walletAddress);
        await tx.wait();

        aadhaarToAddress[aadhaarId] = walletAddress;
        addressToAadhaar[walletAddress] = aadhaarId;

        res.status(200).json({ success: true, message: 'Voter verified and authorized on-chain', transactionHash: tx.hash });
    } catch (error) {
        console.error('Error in verification flow:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. GET Live Results Snapshot
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Oracle & Streaming server running on port ${PORT}`);
});
