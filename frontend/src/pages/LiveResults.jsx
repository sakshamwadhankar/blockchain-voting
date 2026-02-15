import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import ElectionService from "../services/electionService";
import FirebaseService from "../services/firebaseService";
import { GOVERNANCE_ADDRESS } from "../config/contracts";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const electionService = new ElectionService(GOVERNANCE_ADDRESS);

export default function LiveResults() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [election, setElection] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [auditLog, setAuditLog] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // ── Load Data ──────────────────────────────────────
    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                await electionService.initialize();

                // 1. Election Details
                const chainElection = await electionService.getElection(id);
                const metaElection = await FirebaseService.getElectionMetadata(id) || {};

                setElection({
                    id,
                    ...chainElection,
                    ...metaElection,
                    position: chainElection.position || metaElection.title || `Election #${id}`
                });

                // 2. Candidates & Votes
                const chainCandidates = await electionService.getAllCandidates(id);
                const fireCandidates = await FirebaseService.getCandidates(id);

                const mergedCandidates = chainCandidates.map(c => {
                    const meta = fireCandidates.find(fc => fc.candidateId == c.id) || {};
                    return { ...c, ...meta };
                });

                setCandidates(mergedCandidates);

                // 3. Audit Log
                // Fetch recent logs from blockchain (VoteCast events)
                // Note: electionService needs a method for this, or we query straight from contract
                // electionService.getAuditTrail() gets ALL logs. Filter by electionId locally or add filter method.
                // ideally: electionService.getElectionVotes(id)

                // For now, let's use the event listener approach for LIVE updates, 
                // and fetch last 50 events for initial state if possible.
                // Assuming getAuditTrail returns all, we filter.
                const allLogs = await electionService.getAuditTrail(100);
                const electionLogs = allLogs.filter(l => l.electionId == id);
                setAuditLog(electionLogs);

            } catch (err) {
                console.error("Error loading results:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // ── Real-Time Listener ─────────────────────────
        const handleNewVote = (voteEvent) => {
            if (voteEvent.electionId != id) return;

            // Update Candidates Optimistically? 
            // We don't know who they voted for from the event (voterHash, timestamp only).
            // BUT existing `VoteCast` event definition: event VoteCast(uint256 indexed electionId, bytes32 indexed voterHash, uint256 timestamp)
            // It does NOT reveal candidateId to preserve ballot secrecy during the vote? 
            // Wait, standard blockchain voting usually REVEALS the vote tally in real-time or encrypted.
            // Our contract `castVote` updates `candidate.voteCount`.
            // So we can re-fetch candidates on every vote event.

            setRefreshTrigger(prev => prev + 1); // Trigger re-fetch

            setAuditLog(prev => [{
                electionId: voteEvent.electionId,
                voterHash: voteEvent.voterHash,
                timestamp: voteEvent.timestamp,
                verified: true, // on-chain
                isNew: true
            }, ...prev]);
        };

        electionService.onVoteCast(handleNewVote);

        return () => {
            electionService.removeAllListeners();
        };

    }, [id, refreshTrigger]);

    // ── Chart Data ─────────────────────────────────────
    const chartData = {
        labels: candidates.map(c => c.name),
        datasets: [
            {
                label: 'Votes',
                data: candidates.map(c => c.voteCount),
                backgroundColor: candidates.map((_, i) => `hsla(${i * 50 + 200}, 70%, 50%, 0.6)`),
                borderColor: candidates.map((_, i) => `hsla(${i * 50 + 200}, 70%, 50%, 1)`),
                borderWidth: 2,
                borderRadius: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Live Results',
                color: '#94a3b8',
                font: { size: 16 }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: "#cbd5e1", stepSize: 1 },
                grid: { color: "#334155" }
            },
            x: {
                ticks: { color: "#cbd5e1" },
                grid: { display: false }
            }
        }
    };

    if (loading) return (
        <div className="flex h-[50vh] items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!election) return <div className="text-center py-20 text-slate-400">Election not found.</div>;

    const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-up">
            <Link to="/vote" className="text-slate-400 hover:text-white mb-6 inline-block">← Back to Voting</Link>

            <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-8">
                <div>
                    <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 ${election.isActive ? "bg-emerald-500 text-emerald-950" : "bg-red-500 text-white"
                        }`}>
                        {election.isActive ? "LIVE COUNTING" : "FINAL RESULTS"}
                    </span>
                    <h1 className="text-4xl font-bold text-white">{election.position}</h1>
                    <p className="text-slate-400 mt-1">Total Votes Cast: <span className="text-white font-mono text-xl">{totalVotes}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Chart Section ────────────────────────── */}
                <div className="lg:col-span-2 glass p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">📊 Candidate Tally</h2>
                    <div className="h-80">
                        <Bar options={chartOptions} data={chartData} />
                    </div>
                </div>

                {/* ── Audit Trail ──────────────────────────── */}
                <div className="glass p-6 flex flex-col h-[500px]">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <span>⛓️</span> On-Chain Audit
                    </h2>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {auditLog.length === 0 ? (
                            <p className="text-center text-slate-500 mt-10 italic">No votes recorded yet.</p>
                        ) : (
                            auditLog.map((log, idx) => (
                                <div key={idx} className={`p-3 rounded-lg border border-slate-700/50 bg-slate-800/40 text-xs font-mono transition-all ${log.isNew ? 'bg-indigo-500/20 border-indigo-500/50' : ''}`}>
                                    <div className="flex justify-between text-slate-400 mb-1">
                                        <span>Block Time: {new Date(log.timestamp * 1000).toLocaleTimeString()}</span>
                                        <span className="text-emerald-400">Verified</span>
                                    </div>
                                    <div className="text-slate-500 truncate" title={log.voterHash}>
                                        Hash: {log.voterHash}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ── Candidates List ──────────────────────────── */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map(candidate => (
                    <div key={candidate.id} className="glass p-6 border-l-4" style={{ borderLeftColor: `hsla(${candidate.id * 50 + 200}, 70%, 50%, 1)` }}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-white">{candidate.name}</h3>
                                <p className="text-sm text-slate-400">{candidate.department}</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-bold text-white">{candidate.voteCount}</span>
                                <span className="text-xs text-slate-500">votes</span>
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500"
                                style={{
                                    width: `${totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0}%`,
                                    backgroundColor: `hsla(${candidate.id * 50 + 200}, 70%, 50%, 1)`
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
