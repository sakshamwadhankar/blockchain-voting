// ── Contract Config ─────────────────────────────────────
// Last updated from frontend/public/deployments/election-localhost.json
export const GOVERNANCE_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // ElectionManager Address
export const VAULT_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
export const TOKEN_ADDRESS = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";

export const BACKEND_URL = "http://localhost:5000";

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
    "function nextElectionId() public view returns (uint256)"
];

// Kept for reference but likely unused if migrating fully
export const GOVERNANCE_ABI = ELECTION_MANAGER_ABI;

export const STATE_LABELS = ["Pending", "Active", "Succeeded", "Defeated", "Executed", "Cancelled"];

export const STATE_COLORS = {
    Pending: "bg-yellow-500/20 text-yellow-300",
    Active: "bg-cyan-500/20 text-cyan-300",
    Succeeded: "bg-emerald-500/20 text-emerald-300",
    Defeated: "bg-red-500/20 text-red-300",
    Executed: "bg-indigo-500/20 text-indigo-300",
    Cancelled: "bg-gray-500/20 text-gray-400",
};
