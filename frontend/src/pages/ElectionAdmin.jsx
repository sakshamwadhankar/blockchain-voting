import { useState, useEffect } from "react";
import ElectionService from "../services/electionService";

export default function ElectionAdmin() {
  const [electionService, setElectionService] = useState(null);
  const [activeTab, setActiveTab] = useState("create");
  
  // Create Election
  const [position, setPosition] = useState("");
  const [duration, setDuration] = useState("7");
  
  // Add Candidate
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [manifestoIPFS, setManifestoIPFS] = useState("");
  
  // Cast Vote (Admin Testing)
  const [voteElection, setVoteElection] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [corporateId, setCorporateId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [voterToken, setVoterToken] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    initializeService();
  }, []);

  useEffect(() => {
    if (electionService && voteElection) {
      loadCandidates();
      checkVotingStatus();
    }
  }, [electionService, voteElection]);

  const initializeService = async () => {
    try {
      const response = await fetch("/deployments/election-localhost.json");
      const deployment = await response.json();
      
      const service = new ElectionService(deployment.electionManager);
      await service.initialize();
      setElectionService(service);
      
      await loadElections(service);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to connect to blockchain" });
    }
  };

  const loadElections = async (service) => {
    const total = await service.getTotalElections();
    const electionList = [];
    
    for (let i = 0; i < total; i++) {
      const election = await service.getElection(i);
      electionList.push({ id: i, ...election });
    }
    
    setElections(electionList);
  };

  const loadCandidates = async () => {
    if (!electionService || !voteElection) return;
    
    try {
      const candidateList = await electionService.getAllCandidates(parseInt(voteElection));
      setCandidates(candidateList);
    } catch (error) {
      console.error("Failed to load candidates:", error);
    }
  };

  const checkVotingStatus = async () => {
    if (!electionService || !voteElection || !corporateId) return;
    
    try {
      const voted = await electionService.hasVoted(parseInt(voteElection), corporateId);
      setHasVoted(voted);
    } catch (error) {
      console.error("Failed to check voting status:", error);
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    
    if (!position || !duration) {
      setMessage({ type: "error", text: "Please fill all fields" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const electionId = await electionService.createElection(position, parseInt(duration));
      setMessage({ 
        type: "success", 
        text: `Election created successfully! ID: ${electionId}` 
      });
      
      setPosition("");
      setDuration("7");
      await loadElections(electionService);
      
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to create election" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    
    if (!selectedElection || !candidateName || !employeeId || !department) {
      setMessage({ type: "error", text: "Please fill all required fields" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await electionService.addCandidate(
        parseInt(selectedElection),
        candidateName,
        employeeId,
        department,
        manifestoIPFS || ""
      );
      
      setMessage({ 
        type: "success", 
        text: `Candidate ${candidateName} added successfully!` 
      });
      
      setCandidateName("");
      setEmployeeId("");
      setDepartment("");
      setManifestoIPFS("");
      
      // Reload elections to update candidate count
      await loadElections(electionService);
      
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to add candidate" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeElection = async (electionId) => {
    if (!confirm("Are you sure you want to finalize this election? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await electionService.finalizeElection(electionId);
      setMessage({ 
        type: "success", 
        text: "Election finalized and results published!" 
      });
      await loadElections(electionService);
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to finalize election" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestToken = async (e) => {
    e.preventDefault();
    
    if (!corporateId || !mfaCode) {
      setMessage({ type: "error", text: "Please enter Corporate ID and MFA code" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await electionService.issueVoterToken(corporateId, mfaCode);
      setMessage({ 
        type: "success", 
        text: "Token issued! For testing, use any bytes32 value as token." 
      });
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to issue token" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCastVote = async (e) => {
    e.preventDefault();

    if (!voteElection || !selectedCandidate || !corporateId || !voterToken) {
      setMessage({ type: "error", text: "Please fill all fields" });
      return;
    }

    if (hasVoted) {
      setMessage({ type: "error", text: "Already voted in this election" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const txHash = await electionService.castVote(
        parseInt(voteElection),
        parseInt(selectedCandidate),
        corporateId,
        voterToken
      );

      setMessage({ 
        type: "success", 
        text: `Vote cast successfully! Transaction: ${txHash.slice(0, 10)}...` 
      });
      
      setHasVoted(true);
      setCorporateId("");
      setMfaCode("");
      setVoterToken("");
      setSelectedCandidate("");
      
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to cast vote" 
      });
    } finally {
      setLoading(false);
    }
  };

  const getElectionStatus = (election) => {
    const now = Date.now() / 1000;
    if (now < election.startTime) return { label: "Upcoming", color: "bg-yellow-500" };
    if (now > election.endTime && !election.resultsPublished) return { label: "Ended - Pending Finalization", color: "bg-orange-500" };
    if (election.resultsPublished) return { label: "Finalized", color: "bg-gray-500" };
    return { label: "Active", color: "bg-green-500" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚙️ Election Administration</h1>
          <p className="text-indigo-200">Manage elections, candidates, and results</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === "create"
                ? "bg-indigo-600 text-white"
                : "bg-white/10 text-indigo-200 hover:bg-white/20"
            }`}
          >
            Create Election
          </button>
          <button
            onClick={() => setActiveTab("candidates")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === "candidates"
                ? "bg-indigo-600 text-white"
                : "bg-white/10 text-indigo-200 hover:bg-white/20"
            }`}
          >
            Add Candidates
          </button>
          <button
            onClick={() => setActiveTab("vote")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === "vote"
                ? "bg-indigo-600 text-white"
                : "bg-white/10 text-indigo-200 hover:bg-white/20"
            }`}
          >
            Cast Vote (Test)
          </button>
          <button
            onClick={() => {
              setActiveTab("manage");
              if (electionService) loadElections(electionService);
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === "manage"
                ? "bg-indigo-600 text-white"
                : "bg-white/10 text-indigo-200 hover:bg-white/20"
            }`}
          >
            Manage Elections
          </button>
        </div>

        {/* Create Election Tab */}
        {activeTab === "create" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">🗳️ Create New Election</h2>
            
            <form onSubmit={handleCreateElection} className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">Position Title</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., CEO, Board Member, Department Head"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Duration (days)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  max="365"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-indigo-200 text-sm mt-2">
                  Election will run for {duration} days from creation
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg transition-colors"
              >
                {loading ? "Creating..." : "Create Election"}
              </button>
            </form>
          </div>
        )}

        {/* Add Candidates Tab */}
        {activeTab === "candidates" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">👥 Add Candidate</h2>
            
            <form onSubmit={handleAddCandidate} className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">Select Election</label>
                <select
                  value={selectedElection}
                  onChange={(e) => setSelectedElection(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose an election --</option>
                  {elections.filter(e => !e.resultsPublished).map((election) => (
                    <option key={election.id} value={election.id} className="bg-slate-800">
                      {election.position} (ID: {election.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">Candidate Name *</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Employee ID *</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="EMP-12345"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Department *</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., Engineering, Sales, Operations"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Manifesto IPFS Hash (optional)</label>
                <input
                  type="text"
                  value={manifestoIPFS}
                  onChange={(e) => setManifestoIPFS(e.target.value)}
                  placeholder="QmXxx... (IPFS hash)"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-indigo-200 text-sm mt-2">
                  Upload candidate's manifesto to IPFS and paste the hash here
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedElection}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg transition-colors"
              >
                {loading ? "Adding..." : "Add Candidate"}
              </button>
            </form>
          </div>
        )}

        {/* Cast Vote Tab */}
        {activeTab === "vote" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">🗳️ Cast Vote (Admin Testing)</h2>
            
            {/* Election Selection */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">Select Election</label>
              <select
                value={voteElection}
                onChange={(e) => setVoteElection(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose an election --</option>
                {elections.filter(e => e.isActive).map((election) => (
                  <option key={election.id} value={election.id} className="bg-slate-800">
                    {election.position} ({election.totalVotes} votes)
                  </option>
                ))}
              </select>
            </div>

            {voteElection && (
              <>
                {/* MFA Section */}
                <div className="bg-purple-500/20 rounded-xl p-6 mb-6 border border-purple-500/30">
                  <h3 className="text-xl font-bold text-white mb-4">🔐 Multi-Factor Authentication</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-purple-200 mb-2">Corporate ID</label>
                      <input
                        type="text"
                        value={corporateId}
                        onChange={(e) => setCorporateId(e.target.value)}
                        placeholder="Enter corporate ID (e.g., CORP-001)"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-purple-200 mb-2">MFA Code</label>
                      <input
                        type="text"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        placeholder="Enter MFA code (e.g., 123456)"
                        maxLength={6}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <button
                      onClick={handleRequestToken}
                      disabled={loading || !corporateId || !mfaCode}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      {loading ? "Processing..." : "Request Voter Token"}
                    </button>
                  </div>
                </div>

                {/* Voting Section */}
                <div className="bg-blue-500/20 rounded-xl p-6 mb-6 border border-blue-500/30">
                  <h3 className="text-xl font-bold text-white mb-4">📋 Select Candidate</h3>
                  
                  <div className="space-y-3 mb-4">
                    {candidates.map((candidate) => (
                      <label
                        key={candidate.id}
                        className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedCandidate === candidate.id.toString()
                            ? "border-blue-400 bg-blue-500/30"
                            : "border-white/20 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <input
                          type="radio"
                          name="candidate"
                          value={candidate.id}
                          checked={selectedCandidate === candidate.id.toString()}
                          onChange={(e) => setSelectedCandidate(e.target.value)}
                          className="mr-3"
                        />
                        <span className="text-white font-semibold">{candidate.name}</span>
                        <span className="text-blue-200 ml-2">({candidate.department})</span>
                        {candidate.manifestoIPFS && (
                          <a
                            href={`https://ipfs.io/ipfs/${candidate.manifestoIPFS}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 text-blue-400 hover:text-blue-300 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Manifesto →
                          </a>
                        )}
                      </label>
                    ))}
                  </div>

                  <div className="mb-4">
                    <label className="block text-blue-200 mb-2">Voter Token</label>
                    <input
                      type="text"
                      value={voterToken}
                      onChange={(e) => setVoterToken(e.target.value)}
                      placeholder="For testing: 0x1234567890123456789012345678901234567890123456789012345678901234"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                    <p className="text-blue-200 text-xs mt-2">
                      For testing: Use any 66-character hex string starting with 0x
                    </p>
                  </div>

                  <button
                    onClick={handleCastVote}
                    disabled={loading || !selectedCandidate || !voterToken || hasVoted}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg transition-colors text-lg"
                  >
                    {loading ? "Casting Vote..." : hasVoted ? "Already Voted" : "Cast Vote 🗳️"}
                  </button>
                </div>

                {/* Privacy Notice */}
                <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Privacy Guaranteed</h4>
                      <p className="text-green-200 text-sm">
                        Your vote is completely anonymous. Only the fact that you voted is recorded,
                        not your choice. Corporate ID is hashed for verification.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Manage Elections Tab */}
        {activeTab === "manage" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">📊 Manage Elections</h2>
            
            <div className="space-y-4">
              {elections.map((election) => {
                const status = getElectionStatus(election);
                const canFinalize = Date.now() / 1000 > election.endTime && !election.resultsPublished;
                
                return (
                  <div key={election.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{election.position}</h3>
                        <div className="flex gap-4 text-sm text-indigo-200">
                          <span>ID: {election.id}</span>
                          <span>Candidates: {election.candidateCount}</span>
                          <span>Votes: {election.totalVotes}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status.color} text-white`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-indigo-300">Start:</span>
                        <span className="text-white ml-2">
                          {new Date(election.startTime * 1000).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-indigo-300">End:</span>
                        <span className="text-white ml-2">
                          {new Date(election.endTime * 1000).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {canFinalize && (
                      <button
                        onClick={() => handleFinalizeElection(election.id)}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                      >
                        Finalize Election & Publish Results
                      </button>
                    )}
                  </div>
                );
              })}

              {elections.length === 0 && (
                <div className="text-center py-12 text-indigo-200">
                  No elections created yet. Create your first election!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Display */}
        {message.text && (
          <div className={`mt-6 p-4 rounded-lg ${
            message.type === "success" 
              ? "bg-green-500/20 border border-green-500/30 text-green-200" 
              : "bg-red-500/20 border border-red-500/30 text-red-200"
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
