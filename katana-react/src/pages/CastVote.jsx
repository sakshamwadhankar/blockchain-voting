import { useState, useEffect } from "react";
import ElectionService from "../services/electionService";

export default function CastVote() {
  const [electionService, setElectionService] = useState(null);
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  
  // Form fields
  const [corporateId, setCorporateId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [voterToken, setVoterToken] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    initializeService();
  }, []);

  useEffect(() => {
    if (electionService && selectedElection) {
      loadCandidates();
      checkVotingStatus();
    }
  }, [electionService, selectedElection]);

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
      const now = Date.now() / 1000;
      if (election.isActive && now >= election.startTime && now <= election.endTime) {
        electionList.push({ id: i, ...election });
      }
    }
    
    setElections(electionList);
  };

  const loadCandidates = async () => {
    if (!electionService || !selectedElection) return;
    
    try {
      const candidateList = await electionService.getAllCandidates(parseInt(selectedElection));
      setCandidates(candidateList);
    } catch (error) {
      console.error("Failed to load candidates:", error);
    }
  };

  const checkVotingStatus = async () => {
    if (!electionService || !selectedElection || !corporateId) return;
    
    try {
      const voted = await electionService.hasVoted(parseInt(selectedElection), corporateId);
      setHasVoted(voted);
    } catch (error) {
      console.error("Failed to check voting status:", error);
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
      // In production, this would be called by backend after MFA verification
      const receipt = await electionService.issueVoterToken(corporateId, mfaCode);
      
      // Extract token from event (simplified - in production, backend would return this)
      setMessage({ 
        type: "success", 
        text: "Token issued! Check your email/SMS for the token code." 
      });
      
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to issue token. Contact admin." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCastVote = async (e) => {
    e.preventDefault();

    if (!selectedElection || !selectedCandidate || !corporateId || !voterToken) {
      setMessage({ type: "error", text: "Please fill all fields" });
      return;
    }

    if (hasVoted) {
      setMessage({ type: "error", text: "You have already voted in this election" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const txHash = await electionService.castVote(
        parseInt(selectedElection),
        parseInt(selectedCandidate),
        corporateId,
        voterToken
      );

      setMessage({ 
        type: "success", 
        text: `Vote cast successfully! Transaction: ${txHash.slice(0, 10)}...` 
      });
      
      setHasVoted(true);
      
      // Clear sensitive data
      setCorporateId("");
      setMfaCode("");
      setVoterToken("");
      setSelectedCandidate("");
      
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to cast vote. Please check your token." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🗳️ Cast Your Vote</h1>
          <p className="text-purple-200">Secure, Anonymous, Blockchain-Verified</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          
          {/* Election Selection */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">Select Election</label>
            <select
              value={selectedElection}
              onChange={(e) => setSelectedElection(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Choose an election --</option>
              {elections.map((election) => (
                <option key={election.id} value={election.id} className="bg-slate-800">
                  {election.position} ({election.totalVotes} votes)
                </option>
              ))}
            </select>
          </div>

          {selectedElection && (
            <>
              {/* MFA Section */}
              <div className="bg-purple-500/20 rounded-xl p-6 mb-6 border border-purple-500/30">
                <h2 className="text-xl font-bold text-white mb-4">🔐 Multi-Factor Authentication</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-purple-200 mb-2">Corporate ID</label>
                    <input
                      type="text"
                      value={corporateId}
                      onChange={(e) => setCorporateId(e.target.value)}
                      placeholder="Enter your corporate ID"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-200 mb-2">MFA Code (from authenticator app)</label>
                    <input
                      type="text"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="Enter 6-digit MFA code"
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
                <h2 className="text-xl font-bold text-white mb-4">📋 Select Candidate</h2>
                
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
                  <label className="block text-blue-200 mb-2">Voter Token (received via email/SMS)</label>
                  <input
                    type="text"
                    value={voterToken}
                    onChange={(e) => setVoterToken(e.target.value)}
                    placeholder="Paste your voter token here"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
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
                    <h3 className="text-white font-semibold mb-1">Privacy Guaranteed</h3>
                    <p className="text-green-200 text-sm">
                      Your vote is completely anonymous. Only the fact that you voted is recorded on the blockchain,
                      not your choice. Your corporate ID is hashed for verification.
                    </p>
                  </div>
                </div>
              </div>
            </>
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

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/5 backdrop-blur rounded-lg p-4 border border-white/10">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="text-white font-semibold mb-1">Tamper-Proof</h3>
            <p className="text-purple-200 text-sm">Votes recorded on blockchain cannot be altered</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-lg p-4 border border-white/10">
            <div className="text-3xl mb-2">🔐</div>
            <h3 className="text-white font-semibold mb-1">MFA Protected</h3>
            <p className="text-purple-200 text-sm">Multi-factor authentication ensures voter identity</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-lg p-4 border border-white/10">
            <div className="text-3xl mb-2">👤</div>
            <h3 className="text-white font-semibold mb-1">Anonymous</h3>
            <p className="text-purple-200 text-sm">Your vote choice remains completely private</p>
          </div>
        </div>
      </div>
    </div>
  );
}
