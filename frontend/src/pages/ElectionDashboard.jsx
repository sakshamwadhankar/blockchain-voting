import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import ElectionService from "../services/electionService";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function ElectionDashboard() {
  const [electionService, setElectionService] = useState(null);
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveUpdates, setLiveUpdates] = useState([]);

  useEffect(() => {
    initializeService();
  }, []);

  useEffect(() => {
    if (electionService && selectedElection !== null) {
      loadElectionData();
      setupLiveListeners();
    }

    return () => {
      if (electionService) {
        electionService.removeAllListeners();
      }
    };
  }, [electionService, selectedElection]);

  const initializeService = async () => {
    try {
      // Load contract address from deployment
      const response = await fetch("/deployments/election-localhost.json");
      const deployment = await response.json();
      
      const service = new ElectionService(deployment.electionManager);
      await service.initialize();
      setElectionService(service);
      
      await loadElections(service);
    } catch (error) {
      console.error("Failed to initialize:", error);
    } finally {
      setLoading(false);
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
    if (electionList.length > 0) {
      setSelectedElection(0);
    }
  };

  const loadElectionData = async () => {
    if (!electionService || selectedElection === null) return;
    
    try {
      const candidateList = await electionService.getAllCandidates(selectedElection);
      setCandidates(candidateList);
      
      const trail = await electionService.getAuditTrail(50);
      setAuditTrail(trail.filter(r => r.electionId === selectedElection));
    } catch (error) {
      console.error("Failed to load election data:", error);
    }
  };

  const setupLiveListeners = () => {
    electionService.onVoteCast((data) => {
      if (data.electionId === selectedElection) {
        setLiveUpdates(prev => [{
          type: "vote",
          timestamp: Date.now(),
          data
        }, ...prev.slice(0, 9)]);
        
        // Refresh data
        loadElectionData();
      }
    });
  };

  const getElectionStatus = (election) => {
    const now = Date.now() / 1000;
    if (now < election.startTime) return { label: "Upcoming", color: "bg-yellow-500" };
    if (now > election.endTime) return { label: "Ended", color: "bg-gray-500" };
    return { label: "Active", color: "bg-green-500" };
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Election System...</div>
      </div>
    );
  }

  const currentElection = elections.find(e => e.id === selectedElection);
  const chartData = candidates.map(c => ({
    name: c.name,
    votes: c.voteCount,
    department: c.department
  }));

  const pieData = candidates.map(c => ({
    name: c.name,
    value: c.voteCount
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🗳️ Election Control Center</h1>
          <p className="text-blue-200">Real-time blockchain-powered voting dashboard</p>
        </div>

        {/* Election Selector */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <label className="text-white font-semibold mb-3 block">Select Election</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {elections.map((election) => {
              const status = getElectionStatus(election);
              return (
                <button
                  key={election.id}
                  onClick={() => setSelectedElection(election.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedElection === election.id
                      ? "border-blue-400 bg-blue-500/30"
                      : "border-white/20 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold">{election.position}</span>
                    <span className={`px-2 py-1 rounded text-xs ${status.color} text-white`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="text-sm text-blue-200">
                    {election.totalVotes} votes • {election.candidateCount} candidates
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {currentElection && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="text-3xl font-bold">{currentElection.totalVotes}</div>
                <div className="text-blue-100">Total Votes Cast</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="text-3xl font-bold">{currentElection.candidateCount}</div>
                <div className="text-green-100">Candidates</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="text-3xl font-bold">{auditTrail.length}</div>
                <div className="text-purple-100">Audit Records</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="text-3xl font-bold">
                  {currentElection.resultsPublished ? "Published" : "Pending"}
                </div>
                <div className="text-orange-100">Results Status</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Bar Chart */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">📊 Vote Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #3b82f6" }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Bar dataKey="votes" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">🥧 Vote Share</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">👥 Candidates</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 text-blue-200">Name</th>
                      <th className="text-left py-3 px-4 text-blue-200">Employee ID</th>
                      <th className="text-left py-3 px-4 text-blue-200">Department</th>
                      <th className="text-left py-3 px-4 text-blue-200">Votes</th>
                      <th className="text-left py-3 px-4 text-blue-200">Manifesto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((candidate, idx) => (
                      <tr key={idx} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-3 px-4 text-white font-semibold">{candidate.name}</td>
                        <td className="py-3 px-4 text-blue-200">{candidate.employeeId}</td>
                        <td className="py-3 px-4 text-blue-200">{candidate.department}</td>
                        <td className="py-3 px-4">
                          <span className="bg-blue-500 text-white px-3 py-1 rounded-full font-bold">
                            {candidate.voteCount}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {candidate.manifestoIPFS && (
                            <a
                              href={`https://ipfs.io/ipfs/${candidate.manifestoIPFS}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              View IPFS
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Audit Trail */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Audit Trail */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">📜 Audit Trail</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {auditTrail.map((record, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-mono text-sm">
                            Voter: {record.voterHash.slice(0, 10)}...{record.voterHash.slice(-8)}
                          </div>
                          <div className="text-blue-200 text-xs mt-1">
                            {formatTime(record.timestamp)}
                          </div>
                        </div>
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                          ✓ Verified
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Updates */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">⚡ Live Updates</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {liveUpdates.map((update, idx) => (
                    <div key={idx} className="bg-green-500/20 rounded-lg p-3 border border-green-500/30 animate-pulse">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🗳️</span>
                        <div>
                          <div className="text-white font-semibold">New Vote Cast!</div>
                          <div className="text-green-200 text-sm">
                            Block: {update.data.blockNumber} • {new Date(update.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {liveUpdates.length === 0 && (
                    <div className="text-center text-blue-200 py-8">
                      Waiting for live updates...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
