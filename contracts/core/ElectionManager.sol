// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ElectionManager
 * @dev Production-grade multi-candidate election system with MFA and privacy features
 * @notice Handles corporate elections with up to 10 candidates per position
 */
contract ElectionManager is Ownable, Pausable {
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════════════════
    
    struct Candidate {
        string name;
        string employeeId;
        string department;
        string manifestoIPFS;  // IPFS hash for manifesto
        uint256 voteCount;
        bool isActive;
    }
    
    struct Election {
        string position;           // e.g., "CEO", "Board Member"
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool resultsPublished;
        uint256 totalVotes;
        uint256 candidateCount;
        mapping(uint256 => Candidate) candidates;  // candidateId => Candidate
        mapping(bytes32 => bool) hasVoted;         // hash(corporateId) => voted status
        mapping(bytes32 => bytes32) voteCommitments; // hash(corporateId) => commitment
    }
    
    struct VoteRecord {
        uint256 electionId;
        uint256 timestamp;
        bytes32 voterHash;  // Hashed corporate ID for audit trail
        bool verified;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════
    
    uint256 public nextElectionId;
    uint256 public constant MAX_CANDIDATES = 10;
    
    mapping(uint256 => Election) public elections;
    mapping(bytes32 => bool) public validVoterTokens;  // MFA tokens
    VoteRecord[] public auditTrail;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════
    
    event ElectionCreated(
        uint256 indexed electionId,
        string position,
        uint256 startTime,
        uint256 endTime
    );
    
    event CandidateAdded(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        string name,
        string employeeId
    );
    
    event VoteCast(
        uint256 indexed electionId,
        bytes32 indexed voterHash,
        uint256 timestamp
    );
    
    event ElectionFinalized(
        uint256 indexed electionId,
        uint256 winningCandidateId,
        uint256 totalVotes
    );
    
    event VoterTokenIssued(bytes32 indexed tokenHash);
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════════════════════
    
    modifier electionExists(uint256 _electionId) {
        require(_electionId < nextElectionId, "Election does not exist");
        _;
    }
    
    modifier electionActive(uint256 _electionId) {
        Election storage election = elections[_electionId];
        require(election.isActive, "Election is not active");
        require(block.timestamp >= election.startTime, "Election has not started");
        require(block.timestamp <= election.endTime, "Election has ended");
        _;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════
    
    constructor(address _owner) Ownable(_owner) {}
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Create a new election with specified position and duration
     */
    function createElection(
        string calldata _position,
        uint256 _durationInDays
    ) external onlyOwner returns (uint256) {
        uint256 electionId = nextElectionId++;
        Election storage election = elections[electionId];
        
        election.position = _position;
        election.startTime = block.timestamp;
        election.endTime = block.timestamp + (_durationInDays * 1 days);
        election.isActive = true;
        
        emit ElectionCreated(electionId, _position, election.startTime, election.endTime);
        return electionId;
    }
    
    /**
     * @dev Add a candidate to an election
     */
    function addCandidate(
        uint256 _electionId,
        string calldata _name,
        string calldata _employeeId,
        string calldata _department,
        string calldata _manifestoIPFS
    ) external onlyOwner electionExists(_electionId) {
        Election storage election = elections[_electionId];
        require(election.candidateCount < MAX_CANDIDATES, "Maximum candidates reached");
        require(block.timestamp < election.endTime, "Cannot add candidates after election ends");
        
        uint256 candidateId = election.candidateCount++;
        Candidate storage candidate = election.candidates[candidateId];
        
        candidate.name = _name;
        candidate.employeeId = _employeeId;
        candidate.department = _department;
        candidate.manifestoIPFS = _manifestoIPFS;
        candidate.isActive = true;
        
        emit CandidateAdded(_electionId, candidateId, _name, _employeeId);
    }
    
    /**
     * @dev Issue MFA token for voter authentication
     */
    function issueVoterToken(string calldata _corporateId, string calldata _mfaCode) 
        external 
        onlyOwner 
        returns (bytes32) 
    {
        bytes32 tokenHash = keccak256(abi.encodePacked(_corporateId, _mfaCode, block.timestamp));
        validVoterTokens[tokenHash] = true;
        emit VoterTokenIssued(tokenHash);
        return tokenHash;
    }
    
    /**
     * @dev Finalize election and publish results
     */
    function finalizeElection(uint256 _electionId) 
        external 
        onlyOwner 
        electionExists(_electionId) 
    {
        Election storage election = elections[_electionId];
        require(block.timestamp > election.endTime, "Election still ongoing");
        require(!election.resultsPublished, "Results already published");
        
        election.isActive = false;
        election.resultsPublished = true;
        
        uint256 winningCandidateId = getWinningCandidate(_electionId);
        emit ElectionFinalized(_electionId, winningCandidateId, election.totalVotes);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // VOTING FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Cast a vote with MFA verification and privacy protection
     * @param _electionId The election to vote in
     * @param _candidateId The candidate to vote for
     * @param _corporateId Hashed corporate ID for one-person-one-vote
     * @param _voterToken MFA token for authentication
     */
    function castVote(
        uint256 _electionId,
        uint256 _candidateId,
        bytes32 _corporateId,
        bytes32 _voterToken
    ) external whenNotPaused electionActive(_electionId) {
        Election storage election = elections[_electionId];
        
        // MFA verification
        require(validVoterTokens[_voterToken], "Invalid voter token");
        
        // One-person-one-vote check
        bytes32 voterHash = keccak256(abi.encodePacked(_corporateId));
        require(!election.hasVoted[voterHash], "Already voted in this election");
        
        // Validate candidate
        require(_candidateId < election.candidateCount, "Invalid candidate");
        require(election.candidates[_candidateId].isActive, "Candidate not active");
        
        // Record vote (anonymized)
        election.hasVoted[voterHash] = true;
        election.candidates[_candidateId].voteCount++;
        election.totalVotes++;
        
        // Invalidate token after use
        validVoterTokens[_voterToken] = false;
        
        // Add to audit trail (voter identity is hashed)
        auditTrail.push(VoteRecord({
            electionId: _electionId,
            timestamp: block.timestamp,
            voterHash: voterHash,
            verified: true
        }));
        
        emit VoteCast(_electionId, voterHash, block.timestamp);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    function getElection(uint256 _electionId) 
        external 
        view 
        electionExists(_electionId)
        returns (
            string memory position,
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            bool resultsPublished,
            uint256 totalVotes,
            uint256 candidateCount
        ) 
    {
        Election storage election = elections[_electionId];
        return (
            election.position,
            election.startTime,
            election.endTime,
            election.isActive,
            election.resultsPublished,
            election.totalVotes,
            election.candidateCount
        );
    }
    
    function getCandidate(uint256 _electionId, uint256 _candidateId)
        external
        view
        electionExists(_electionId)
        returns (
            string memory name,
            string memory employeeId,
            string memory department,
            string memory manifestoIPFS,
            uint256 voteCount,
            bool isActive
        )
    {
        Election storage election = elections[_electionId];
        require(_candidateId < election.candidateCount, "Invalid candidate");
        Candidate storage candidate = election.candidates[_candidateId];
        
        return (
            candidate.name,
            candidate.employeeId,
            candidate.department,
            candidate.manifestoIPFS,
            candidate.voteCount,
            candidate.isActive
        );
    }
    
    function getWinningCandidate(uint256 _electionId) 
        public 
        view 
        electionExists(_electionId)
        returns (uint256) 
    {
        Election storage election = elections[_electionId];
        uint256 winningId = 0;
        uint256 maxVotes = 0;
        
        for (uint256 i = 0; i < election.candidateCount; i++) {
            if (election.candidates[i].voteCount > maxVotes) {
                maxVotes = election.candidates[i].voteCount;
                winningId = i;
            }
        }
        
        return winningId;
    }
    
    function hasVotedInElection(uint256 _electionId, bytes32 _corporateIdHash)
        external
        view
        electionExists(_electionId)
        returns (bool)
    {
        return elections[_electionId].hasVoted[_corporateIdHash];
    }
    
    function getAuditTrailLength() external view returns (uint256) {
        return auditTrail.length;
    }
    
    function getAuditRecord(uint256 _index) 
        external 
        view 
        returns (
            uint256 electionId,
            uint256 timestamp,
            bytes32 voterHash,
            bool verified
        ) 
    {
        require(_index < auditTrail.length, "Invalid index");
        VoteRecord storage record = auditTrail[_index];
        return (record.electionId, record.timestamp, record.voterHash, record.verified);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EMERGENCY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
