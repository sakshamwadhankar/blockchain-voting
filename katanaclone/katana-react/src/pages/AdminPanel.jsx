import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useWallet } from "../context/WalletContext";
import { STATE_LABELS, STATE_COLORS, BACKEND_URL } from "../config/contracts";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminPanel() {
    const { account, governance } = useWallet();
    const navigate = useNavigate();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(null);
    const [txStatus, setTxStatus] = useState({ type: "", message: "" });
    
    // New state for analytics
    const [voterStats, setVoterStats] = useState(null);
    const [adminLogs, setAdminLogs] = useState([]);
    
    // Election creation state
    const [electionTitle, setElectionTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [votingDuration, setVotingDuration] = useState(0); // in seconds
    const [systemConfig, setSystemConfig] = useState({
        votingPeriod: 0,
        quorum: "4%",
        adminWallet: ""
    });

    const fetchProposals = useCallback(async () => {
        if (!governance) return;
        setLoading(true);
        try {
            const count = await governance.nextProposalId();
            const items = [];
            for (let i = 0; i < Number(count); i++) {
                const p = await governance.getProposal(i);
                const s = await governance.state(i);
                items.push({
                    id: i,
                    proposer: p.proposer,
                    description: p.description,
                    recipient: p.recipient,
                    amount: p.amount,
                    forVotes: p.forVotes,
                    againstVotes: p.againstVotes,
                    startTime: Number(p.startTime),
                    endTime: Number(p.endTime),
                    executed: p.executed,
                    cancelled: p.cancelled,
                    state: STATE_LABELS[Number(s)] || "Unknown",
                });
            }
            setProposals(items.reverse());
        } catch (err) {
            console.error("Admin fetch:", err);
        }
        setLoading(false);
    }, [governance]);

    // Fetch voter analytics
    const fetchVoterStats = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/analytics/voters`);
            const data = await res.json();
            if (data.success) {
                setVoterStats(data.data);
            }
        } catch (err) {
            console.error("Analytics fetch error:", err);
        }
    }, []);

    // Fetch system configuration
    const fetchSystemConfig = useCallback(async () => {
        if (!governance || !account) return;
        try {
            const period = await governance.votingPeriod();
            setVotingDuration(Number(period));
            setSystemConfig({
                votingPeriod: Number(period),
                quorum: "4%", // Hardcoded as per requirement
                adminWallet: account
            });
        } catch (err) {
            console.error("Config fetch error:", err);
            // Fallback to default 1 day if contract doesn't have votingPeriod
            setVotingDuration(86400);
            setSystemConfig({
                votingPeriod: 86400,
                quorum: "4%",
                adminWallet: account
            });
        }
    }, [governance, account]);

    // Listen to governance events for audit log
    useEffect(() => {
        if (!governance) return;

        const addLog = (type, message, txHash) => {
            setAdminLogs(prev => [{
                type,
                message,
                timestamp: new Date().toISOString(),
                txHash
            }, ...prev].slice(0, 50)); // Keep last 50 logs
        };

        const onProposalCreated = (id, proposer, description) => {
            addLog('created', `Proposal #${id} created: ${description}`, null);
        };

        const onProposalExecuted = (id) => {
            addLog('executed', `Proposal #${id} executed successfully`, null);
        };

        const onProposalCancelled = (id) => {
            addLog('cancelled', `Proposal #${id} cancelled`, null);
        };

        governance.on("ProposalCreated", onProposalCreated);
        governance.on("ProposalExecuted", onProposalExecuted);
        governance.on("ProposalCancelled", onProposalCancelled);

        return () => {
            governance.off("ProposalCreated", onProposalCreated);
            governance.off("ProposalExecuted", onProposalExecuted);
            governance.off("ProposalCancelled", onProposalCancelled);
        };
    }, [governance]);

    useEffect(() => { 
        fetchProposals();
        fetchVoterStats();
        fetchSystemConfig();
    }, [fetchProposals, fetchVoterStats, fetchSystemConfig]);

    const handleExecute = async (id) => {
        setExecuting(id);
        setTxStatus({ type: "", message: "" });
        try {
            const tx = await governance.execute(id);
            setTxStatus({ type: "info", message: `Executing proposal #${id}...` });
            await tx.wait();
            setTxStatus({ type: "success", message: `Proposal #${id} executed! TX: ${tx.hash.slice(0, 16)}...` });
            fetchProposals();
        } catch (err) {
            setTxStatus({ type: "error", message: err.reason || err.message });
        }
        setExecuting(null);
    };

    const handleCancel = async (id) => {
        setExecuting(id);
        setTxStatus({ type: "", message: "" });
        try {
            const tx = await governance.cancel(id);
            setTxStatus({ type: "info", message: `Cancelling proposal #${id}...` });
            await tx.wait();
            setTxStatus({ type: "success", message: `Proposal #${id} cancelled.` });
            fetchProposals();
        } catch (err) {
            setTxStatus({ type: "error", message: err.reason || err.message });
        }
        setExecuting(null);
    };

    const handleCreateElection = async () => {
        if (!electionTitle.trim()) {
            setTxStatus({ type: "error", message: "Please enter an election title" });
            return;
        }

        setIsCreating(true);
        setTxStatus({ type: "", message: "" });

        try {
            // Create proposal with ZeroAddress and 0 amount for standard voting
            const tx = await governance.propose(
                electionTitle.trim(),
                ethers.ZeroAddress,
                0
            );
            
            setTxStatus({ type: "info", message: "Creating election..." });
            const receipt = await tx.wait();
            
            // Extract proposal ID from event
            const event = receipt.logs.find(log => {
                try {
                    return governance.interface.parseLog(log)?.name === "ProposalCreated";
                } catch { return false; }
            });
            
            const proposalId = event ? governance.interface.parseLog(event).args[0] : "New";
            
            setTxStatus({ 
                type: "success", 
                message: `🎉 Election #${proposalId} created successfully!` 
            });
            
            setElectionTitle("");
            fetchProposals();
        } catch (err) {
            setTxStatus({ type: "error", message: err.reason || err.message });
        }
        setIsCreating(false);
    };

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    };

    const getEstimatedEndTime = () => {
        if (!votingDuration) return "Loading...";
        const endTime = new Date(Date.now() + votingDuration * 1000);
        return endTime.toLocaleString();
    };

    const formatEth = (wei) => {
        try { return ethers.formatEther(wei); } catch { return "0"; }
    };

    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 animate-fade-up">
                <div className="glass p-10 text-center max-w-md">
                    <div className="text-5xl mb-4">🔐</div>
                    <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
                    <p className="text-slate-400">Connect the owner wallet to manage proposals.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-up">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                        Election Command Center
                    </h1>
                    <p className="text-slate-400 mt-1">Create elections, manage proposals, and monitor voter registry</p>
                </div>
                <button
                    onClick={() => navigate("/register-employee")}
                    className="px-4 py-2.5 rounded-xl font-semibold text-white cursor-pointer
                             bg-gradient-to-r from-indigo-500 to-purple-500
                             hover:from-indigo-400 hover:to-purple-400
                             transition-all duration-300 shadow-lg shadow-indigo-500/20
                             flex items-center gap-2"
                >
                    <span>➕</span>
                    <span>Register Employee</span>
                </button>
            </div>

            {/* ══════════════════════════════════════════════
                ELECTION CREATION & SYSTEM CONFIG
            ══════════════════════════════════════════════ */}

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Launch New Election */}
                <div className="glass p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span>🚀</span> Launch New Election
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">
                                Election Title / Proposal Description
                            </label>
                            <textarea
                                value={electionTitle}
                                onChange={(e) => setElectionTitle(e.target.value)}
                                placeholder="e.g., Should we implement a new employee benefit program?"
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50
                                         text-white placeholder-slate-500 resize-none
                                         focus:outline-none focus:border-amber-500/60 transition-colors"
                            />
                        </div>

                        {/* Timing Preview */}
                        <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 space-y-2">
                            <h3 className="text-sm font-semibold text-slate-300 mb-3">⏱️ Timing Preview</h3>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Start Time:</span>
                                <span className="text-emerald-400 font-mono">Now</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">End Time:</span>
                                <span className="text-cyan-400 font-mono text-xs">
                                    {getEstimatedEndTime()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700">
                                <span className="text-slate-400">Duration:</span>
                                <span className="text-amber-400 font-semibold">
                                    {formatDuration(votingDuration)}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleCreateElection}
                            disabled={isCreating || !electionTitle.trim()}
                            className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer
                                     bg-gradient-to-r from-amber-500 to-orange-500
                                     hover:from-amber-400 hover:to-orange-400
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     transition-all duration-300 shadow-lg shadow-amber-500/20
                                     flex items-center justify-center gap-2"
                        >
                            {isCreating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <span>🚀</span>
                                    <span>Launch Election</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* System Configuration */}
                <div className="glass p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span>⚙️</span> System Configuration
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-400">Voting Period</span>
                                <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300">
                                    Active
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-indigo-300">
                                {formatDuration(systemConfig.votingPeriod)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {systemConfig.votingPeriod.toLocaleString()} seconds
                            </p>
                        </div>

                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-400">Quorum Required</span>
                                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                                    Fixed
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-300">
                                {systemConfig.quorum}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Minimum participation threshold
                            </p>
                        </div>

                        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-400">Admin Wallet</span>
                                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-300">
                                    Connected
                                </span>
                            </div>
                            <p className="text-sm font-mono text-amber-300 truncate">
                                {systemConfig.adminWallet || "Loading..."}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Authorized governance controller
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Status ────────────────────────────────── */}
            {txStatus.message && (
                <div className={`mb-6 p-4 rounded-xl text-sm ${txStatus.type === "error" ? "bg-red-500/10 border border-red-500/30 text-red-300"
                        : txStatus.type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                            : "bg-indigo-500/10 border border-indigo-500/30 text-indigo-300"
                    }`}>
                    {txStatus.message}
                </div>
            )}

            {/* ── Stats Cards ───────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total", value: proposals.length, color: "indigo" },
                    { label: "Active", value: proposals.filter((p) => p.state === "Active").length, color: "cyan" },
                    { label: "Succeeded", value: proposals.filter((p) => p.state === "Succeeded").length, color: "emerald" },
                    { label: "Executed", value: proposals.filter((p) => p.state === "Executed").length, color: "amber" },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`glass px-4 py-5 text-center`}>
                        <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>
                        <p className="text-xs text-slate-400 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* ── Proposals Table ───────────────────────── */}
            {loading ? (
                <div className="text-center py-16">
                    <div className="inline-block w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 mt-4">Loading proposals...</p>
                </div>
            ) : (
                <div className="space-y-3 mb-8">
                    {proposals.map((p) => (
                        <div key={p.id} className="glass p-5 flex flex-col md:flex-row md:items-center gap-4 animate-fade-up">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-slate-500">#{p.id}</span>
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATE_COLORS[p.state] || ""}`}>
                                        {p.state}
                                    </span>
                                </div>
                                <p className="text-white text-sm truncate">{p.description}</p>
                                <div className="flex gap-4 mt-1.5 text-xs text-slate-500">
                                    <span>For: {formatEth(p.forVotes)}</span>
                                    <span>Against: {formatEth(p.againstVotes)}</span>
                                    {p.amount > 0 && <span>💰 {formatEth(p.amount)} ETH</span>}
                                </div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                                {p.state === "Succeeded" && (
                                    <button
                                        onClick={() => handleExecute(p.id)}
                                        disabled={executing === p.id}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer
                               bg-gradient-to-r from-emerald-500 to-cyan-500 text-white
                               hover:from-emerald-400 hover:to-cyan-400
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all duration-300 shadow-lg shadow-emerald-500/20"
                                    >
                                        {executing === p.id ? "Executing..." : "⚡ Execute"}
                                    </button>
                                )}
                                {!p.executed && !p.cancelled && (
                                    <button
                                        onClick={() => handleCancel(p.id)}
                                        disabled={executing === p.id}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer
                               text-red-400 border border-red-500/30
                               hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed
                               transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ══════════════════════════════════════════════
                ELECTION COMMISSION FEATURES
            ══════════════════════════════════════════════ */}

            {/* ── Section 1: Election Health (Charts) ────── */}
            {voterStats && (
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Voter Turnout Chart */}
                    <div className="glass p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span>📊</span> Voter Verification Status
                        </h2>
                        <div className="flex items-center justify-center" style={{ height: '250px' }}>
                            <Doughnut
                                data={{
                                    labels: ['Verified Voters', 'Unverified'],
                                    datasets: [{
                                        data: [voterStats.verifiedCount, voterStats.unverifiedCount],
                                        backgroundColor: [
                                            'rgba(16, 185, 129, 0.8)', // emerald
                                            'rgba(100, 116, 139, 0.5)', // slate
                                        ],
                                        borderColor: [
                                            'rgba(16, 185, 129, 1)',
                                            'rgba(100, 116, 139, 0.8)',
                                        ],
                                        borderWidth: 2,
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                color: '#cbd5e1',
                                                padding: 15,
                                                font: { size: 12 }
                                            }
                                        },
                                        tooltip: {
                                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                            titleColor: '#fff',
                                            bodyColor: '#cbd5e1',
                                            borderColor: 'rgba(99, 102, 241, 0.5)',
                                            borderWidth: 1,
                                            padding: 12,
                                            displayColors: true,
                                        }
                                    }
                                }}
                            />
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-3xl font-bold text-emerald-400">
                                {voterStats.verificationRate}%
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Verification Rate</p>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="glass p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span>📈</span> Registry Statistics
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/40">
                                <div>
                                    <p className="text-sm text-slate-400">Total Employees</p>
                                    <p className="text-2xl font-bold text-white mt-1">
                                        {voterStats.totalEmployees}
                                    </p>
                                </div>
                                <div className="text-4xl">👥</div>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                <div>
                                    <p className="text-sm text-emerald-400">Verified Voters</p>
                                    <p className="text-2xl font-bold text-emerald-300 mt-1">
                                        {voterStats.verifiedCount}
                                    </p>
                                </div>
                                <div className="text-4xl">✅</div>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/40">
                                <div>
                                    <p className="text-sm text-slate-400">Pending Verification</p>
                                    <p className="text-2xl font-bold text-slate-300 mt-1">
                                        {voterStats.unverifiedCount}
                                    </p>
                                </div>
                                <div className="text-4xl">⏳</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Section 2: Voter Registry (Table) ────── */}
            {voterStats && (
                <div className="glass p-6 mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span>📋</span> Voter Registry
                        <span className="text-xs text-slate-500 ml-auto">
                            {voterStats.totalEmployees} employees
                        </span>
                    </h2>
                    <div className="overflow-x-auto">
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-sm">
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">Employee ID</th>
                                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">Name</th>
                                        <th className="text-center py-3 px-4 text-slate-400 font-semibold">Face Data</th>
                                        <th className="text-center py-3 px-4 text-slate-400 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {voterStats.registry.map((employee, idx) => (
                                        <tr 
                                            key={employee.employeeId} 
                                            className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                                        >
                                            <td className="py-3 px-4 font-mono text-slate-300">
                                                {employee.employeeId}
                                            </td>
                                            <td className="py-3 px-4 text-white">
                                                {employee.name}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {employee.hasFaceData ? (
                                                    <span className="text-cyan-400">🧠</span>
                                                ) : (
                                                    <span className="text-slate-600">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {employee.isVerified ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                                                        <span>✅</span> Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-400 text-xs font-semibold">
                                                        <span>❌</span> Pending
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Section 3: Governance Audit Log ────── */}
            <div className="glass p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>📜</span> Governance Audit Log
                    <span className="text-xs text-slate-500 ml-auto">
                        {adminLogs.length} events
                    </span>
                </h2>
                <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-xs max-h-64 overflow-y-auto">
                    {adminLogs.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">
                            No governance events yet. Events will appear here in real-time.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {adminLogs.map((log, idx) => (
                                <div 
                                    key={idx} 
                                    className={`flex items-start gap-3 p-2 rounded ${
                                        log.type === 'created' ? 'bg-indigo-500/10 border-l-2 border-indigo-500' :
                                        log.type === 'executed' ? 'bg-emerald-500/10 border-l-2 border-emerald-500' :
                                        'bg-red-500/10 border-l-2 border-red-500'
                                    }`}
                                >
                                    <span className="text-slate-500 shrink-0">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                    <span className={`shrink-0 ${
                                        log.type === 'created' ? 'text-indigo-400' :
                                        log.type === 'executed' ? 'text-emerald-400' :
                                        'text-red-400'
                                    }`}>
                                        [{log.type.toUpperCase()}]
                                    </span>
                                    <span className="text-slate-300 flex-1">
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
