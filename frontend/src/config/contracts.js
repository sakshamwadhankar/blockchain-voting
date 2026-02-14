// ── Contract Config ─────────────────────────────────────
// After deploying, update these addresses or import from ../contracts/
export const GOVERNANCE_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace after deploy
export const VAULT_ADDRESS = "0x0000000000000000000000000000000000000000";
export const TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";

export const BACKEND_URL = "http://localhost:5000";

export const GOVERNANCE_ABI = [
    "function propose(string description, address recipient, uint256 amount) external returns (uint256)",
    "function vote(uint256 id, bool support) external",
    "function execute(uint256 id) external",
    "function cancel(uint256 id) external",
    "function getProposal(uint256 id) external view returns (address proposer, string description, address recipient, uint256 amount, uint256 forVotes, uint256 againstVotes, uint256 startTime, uint256 endTime, bool executed, bool cancelled)",
    "function state(uint256 id) public view returns (uint8)",
    "function isVerified(address) public view returns (bool)",
    "function hasVoted(uint256 id, address account) external view returns (bool)",
    "function nextProposalId() public view returns (uint256)",
    "function governanceToken() public view returns (address)",
    "event ProposalCreated(uint256 indexed id, address indexed proposer, string description, address recipient, uint256 amount)",
    "event Voted(uint256 indexed id, address indexed voter, bool support, uint256 weight)",
    "event ProposalExecuted(uint256 indexed id)",
    "event ProposalCancelled(uint256 indexed id)",
];

export const STATE_LABELS = ["Pending", "Active", "Succeeded", "Defeated", "Executed", "Cancelled"];

export const STATE_COLORS = {
    Pending: "bg-yellow-500/20 text-yellow-300",
    Active: "bg-cyan-500/20 text-cyan-300",
    Succeeded: "bg-emerald-500/20 text-emerald-300",
    Defeated: "bg-red-500/20 text-red-300",
    Executed: "bg-indigo-500/20 text-indigo-300",
    Cancelled: "bg-gray-500/20 text-gray-400",
};
