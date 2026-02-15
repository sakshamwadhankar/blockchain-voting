import { ethers } from "ethers";

// Election Manager ABI
export const ELECTION_MANAGER_ABI = [
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

class ElectionService {
  constructor(contractAddress) {
    this.contractAddress = contractAddress;
    this.provider = null;
    this.contract = null;
    this.signer = null;
  }

  async initialize() {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask not installed");
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    this.contract = new ethers.Contract(
      this.contractAddress,
      ELECTION_MANAGER_ABI,
      this.signer
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async createElection(position, durationInDays) {
    const tx = await this.contract.createElection(position, durationInDays);
    const receipt = await tx.wait();
    
    // Extract election ID from event
    const event = receipt.logs.find(log => {
      try {
        return this.contract.interface.parseLog(log).name === "ElectionCreated";
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = this.contract.interface.parseLog(event);
      return parsed.args.electionId;
    }
    
    return null;
  }

  async addCandidate(electionId, name, employeeId, department, manifestoIPFS) {
    const tx = await this.contract.addCandidate(
      electionId,
      name,
      employeeId,
      department,
      manifestoIPFS
    );
    await tx.wait();
    return tx.hash;
  }

  async issueVoterToken(corporateId, mfaCode) {
    const tx = await this.contract.issueVoterToken(corporateId, mfaCode);
    const receipt = await tx.wait();
    return receipt;
  }

  async finalizeElection(electionId) {
    const tx = await this.contract.finalizeElection(electionId);
    await tx.wait();
    return tx.hash;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VOTING FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async castVote(electionId, candidateId, corporateId, voterToken) {
    // Hash the corporate ID for privacy
    const corporateIdHash = ethers.keccak256(ethers.toUtf8Bytes(corporateId));
    
    const tx = await this.contract.castVote(
      electionId,
      candidateId,
      corporateIdHash,
      voterToken
    );
    await tx.wait();
    return tx.hash;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async getElection(electionId) {
    const result = await this.contract.getElection(electionId);
    return {
      position: result[0],
      startTime: Number(result[1]),
      endTime: Number(result[2]),
      isActive: result[3],
      resultsPublished: result[4],
      totalVotes: Number(result[5]),
      candidateCount: Number(result[6])
    };
  }

  async getCandidate(electionId, candidateId) {
    const result = await this.contract.getCandidate(electionId, candidateId);
    return {
      name: result[0],
      employeeId: result[1],
      department: result[2],
      manifestoIPFS: result[3],
      voteCount: Number(result[4]),
      isActive: result[5]
    };
  }

  async getAllCandidates(electionId) {
    const election = await this.getElection(electionId);
    const candidates = [];
    
    for (let i = 0; i < election.candidateCount; i++) {
      const candidate = await this.getCandidate(electionId, i);
      candidates.push({ ...candidate, id: i });
    }
    
    return candidates;
  }

  async getWinningCandidate(electionId) {
    const winningId = await this.contract.getWinningCandidate(electionId);
    return Number(winningId);
  }

  async hasVoted(electionId, corporateId) {
    const corporateIdHash = ethers.keccak256(ethers.toUtf8Bytes(corporateId));
    return await this.contract.hasVotedInElection(electionId, corporateIdHash);
  }

  async getAuditTrail(limit = 50) {
    const length = await this.contract.getAuditTrailLength();
    const totalRecords = Number(length);
    const records = [];
    
    const start = Math.max(0, totalRecords - limit);
    for (let i = start; i < totalRecords; i++) {
      const record = await this.contract.getAuditRecord(i);
      records.push({
        electionId: Number(record[0]),
        timestamp: Number(record[1]),
        voterHash: record[2],
        verified: record[3]
      });
    }
    
    return records.reverse(); // Most recent first
  }

  async getTotalElections() {
    const nextId = await this.contract.nextElectionId();
    return Number(nextId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════════

  onVoteCast(callback) {
    this.contract.on("VoteCast", (electionId, voterHash, timestamp, event) => {
      callback({
        electionId: Number(electionId),
        voterHash,
        timestamp: Number(timestamp),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash
      });
    });
  }

  onElectionCreated(callback) {
    this.contract.on("ElectionCreated", (electionId, position, startTime, endTime) => {
      callback({
        electionId: Number(electionId),
        position,
        startTime: Number(startTime),
        endTime: Number(endTime)
      });
    });
  }

  removeAllListeners() {
    this.contract.removeAllListeners();
  }
}

export default ElectionService;
