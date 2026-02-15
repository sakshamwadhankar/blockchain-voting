import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import ElectionService from "../services/electionService";

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#f97316"];

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

  const currentElection = elections.find(e => e.id === selectedElection);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EEFF00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading election data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419] p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-7xl font-bold mb-4 gradient-text" style={{ letterSpacing: '-0.02em' }}>
            national election
          </h1>
          <p className="text-xl text-gray-400 font-light">
            Live Results • Real-time Updates • Complete Transparency
          </p>
        </div>

        {/* Election Selector */}
        {elections.length > 0 && (
          <div className="mb-8">
            <div className="glass p-6">
              <label className="block text-gray-300 text-sm font-medium mb-3">Select Election</label>
              <select
                value={selectedElection ?? ""}
                onChange={(e) => setSelectedElection(parseInt(e.target.value))}
                className="w-full bg-[#1a1f2e] border border-[#EEFF00]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#EEFF00] transition-all"
              >
                {elections.map((election) => {
                  const status = getElectionStatus(election);
                  return (
                    <option key={election.id} value={election.id} className="bg-[#13131a]">
                      {election.position} - {status.label} ({election.totalVotes} votes)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}

        {currentElection && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="glass p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Votes</span>
                  <span className="text-2xl">🗳️</span>
                </div>
                <p className="text-4xl font-bold text-[#EEFF00]">{currentElection.totalVotes}</p>
              </div>

              <div className="glass p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Candidates</span>
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-4xl font-bold text-[#EEFF00]">{currentElection.candidateCount}</p>
              </div>

              <div className="glass p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Status</span>
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-2xl font-bold text-[#EEFF00]">{getElectionStatus(currentElection).label}</p>
              </div>

              <div className="glass p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Audit Records</span>
                  <span className="text-2xl">🔒</span>
                </div>
                <p className="text-4xl font-bold text-[#EEFF00]">{auditTrail.length}</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Bar Chart */}
              <div className="glass p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Vote Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={candidates}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#a1a1aa" />
                    <YAxis stroke="#a1a1aa" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1f2e', 
                        border: '1px solid #EEFF00',
                        borderRadius: '12px',
                        color: '#fff'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="voteCount" fill="#EEFF00" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="glass p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Vote Share</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={candidates}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="voteCount"
                    >
                      {candidates.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1f2e', 
                        border: '1px solid #EEFF00',
                        borderRadius: '12px',
                        color: '#fff'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="glass p-6 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6">Candidates</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#EEFF00]/30">
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Name</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Employee ID</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Department</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Votes</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Manifesto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((candidate, index) => (
                      <tr key={index} className="border-b border-gray-800 hover:bg-[#EEFF00]/10 transition-colors">
                        <td className="py-4 px-4 text-white font-semibold">{candidate.name}</td>
                        <td className="py-4 px-4 text-gray-300">{candidate.employeeId}</td>
                        <td className="py-4 px-4 text-gray-300">{candidate.department}</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-[#EEFF00] text-[#0f1419]">
                            {candidate.voteCount}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {candidate.manifestoIPFS ? (
                            <a
                              href={`https://ipfs.io/ipfs/${candidate.manifestoIPFS}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#EEFF00] hover:text-[#f5ff33] transition-colors"
                            >
                              View →
                            </a>
                          ) : (
                            <span className="text-gray-600">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Updates & Audit Trail */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Live Updates */}
              <div className="glass p-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#EEFF00] rounded-full animate-pulse"></span>
                  Live Updates
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {liveUpdates.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No live updates yet</p>
                  ) : (
                    liveUpdates.map((update, index) => (
                      <div key={index} className="bg-[#1a1f2e] border border-[#EEFF00]/20 rounded-xl p-4 animate-slide-in">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#EEFF00] font-semibold">✓ Vote Cast</span>
                          <span className="text-gray-500 text-sm">
                            {new Date(update.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm font-mono">
                          Voter: {update.data.voterHash.slice(0, 10)}...
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Audit Trail */}
              <div className="glass p-6">
                <h3 className="text-2xl font-bold text-white mb-6">🔒 Audit Trail</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {auditTrail.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No audit records yet</p>
                  ) : (
                    auditTrail.map((record, index) => (
                      <div key={index} className="bg-[#1a1f2e] border border-[#EEFF00]/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#EEFF00] font-semibold">
                            {record.verified ? "✓ Verified" : "⚠ Pending"}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {new Date(record.timestamp * 1000).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm font-mono">
                          Hash: {record.voterHash.slice(0, 20)}...
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {elections.length === 0 && (
          <div className="glass p-12 text-center">
            <div className="text-6xl mb-4">🗳️</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Elections Yet</h3>
            <p className="text-gray-400">Elections will appear here once they are created</p>
          </div>
        )}
      </div>
    </div>
  );
}
