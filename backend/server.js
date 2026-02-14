require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const { ethers } = require('ethers');

const app = express();
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
    "function verifyVoter(address _voter) external"
];
const governanceContract = new ethers.Contract(governanceAddress, governanceAbi, wallet);

// Mock Database for Sybil Protection
// In production, use MongoDB or PostgreSQL
const aadhaarToAddress = {};
const addressToAadhaar = {};

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
        // A. Verify OTP with Twilio
        const verificationCheck = await twilioClient.verify.v2.services(verifyServiceSid)
            .verificationChecks
            .create({ to: phoneNumber, code: code });

        if (verificationCheck.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // B. Sybil Protection: Check if Aadhaar is already linked
        if (aadhaarToAddress[aadhaarId] && aadhaarToAddress[aadhaarId] !== walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'This Aadhaar ID is already linked to another wallet address.'
            });
        }

        // Check if Wallet is already linked to another Aadhaar
        if (addressToAadhaar[walletAddress] && addressToAadhaar[walletAddress] !== aadhaarId) {
            return res.status(400).json({
                success: false,
                message: 'This wallet address is already linked to another Aadhaar ID.'
            });
        }

        // C. On-Chain Authorization (Call Governance.verifyVoter)
        console.log(`Authorizing voter: ${walletAddress}`);
        const tx = await governanceContract.verifyVoter(walletAddress);
        await tx.wait();

        // D. Save Mapping
        aadhaarToAddress[aadhaarId] = walletAddress;
        addressToAadhaar[walletAddress] = aadhaarId;

        res.status(200).json({
            success: true,
            message: 'Voter verified and authorized on-chain',
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Error in verification flow:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Oracle server running on port ${PORT}`);
});
