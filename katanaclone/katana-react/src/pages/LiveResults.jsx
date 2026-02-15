import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
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

// ── Register Chart.js components ───────────────────────
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function LiveResults() {
    const { governanceContract } = useWallet();
    const [loading, setLoading] = useState(true);

    // Dashboard Data State
    const [proposalId, setProposalId] = useState(null);
    const [results, setResults] = useState({ for: 0, against: 0 });
    const [auditLog, setAuditLog] = useState([]);

    // ── Fetch Initial Data & Listen for Live Events ───────
    useEffect(() => {
        if (!governanceContract) return;

        let isMounted = true;

        const fetchData = async () => {
            try {
                // 1. Get the latest proposal ID
                // Note: In a real app, you might want a dropdown to select proposals.
                // For this demo, we'll just grab the latest one created.
                const nextId = await governanceContract.nextProposalId();
                const currentId = Number(nextId) - 1;

                if (currentId < 0) {
                    setLoading(false);
                    return; // No proposals yet
                }

                setProposalId(currentId);

                // 2. Fetch current vote counts from chain
                const proposal = await governanceContract.getProposal(currentId);
                setResults({
                    for: Number(proposal.forVotes),
                    against: Number(proposal.againstVotes),
                });

                // 3. Fetch past "Voted" events for the Audit Trail
                // Filter: Voted(uint256 indexed id, address indexed voter, bool support, uint256 weight)
                const filter = governanceContract.filters.Voted(currentId);
                const events = await governanceContract.queryFilter(filter);

                const formattedLog = await Promise.all(
                    events.map(async (e) => {
                        const block = await e.getBlock();
                        return {
                            txHash: e.hash,
                            voter: e.args[1],
                            support: e.args[2],
                            weight: e.args[3].toString(),
                            timestamp: new Date(block.timestamp * 1000).toLocaleTimeString(),
                        };
                    })
                );

                // Sort: Newest first
                if (isMounted) {
                    setAuditLog(formattedLog.reverse());
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setLoading(false);
            }
        };

        fetchData();

        // ── Real-Time Listener ─────────────────────────────
        // Listen for ANY vote on ANY proposal (or filter by ID if preferred)
        const handleNewVote = async (id, voter, support, weight, event) => {
            // Only update if it matches our current view
            const votedId = Number(id);
            if (proposalId !== null && votedId !== proposalId) return;

            // Update Chart Data locally (optimistic or separate fetch)
            setResults((prev) => ({
                for: support ? prev.for + Number(weight) : prev.for,
                against: !support ? prev.against + Number(weight) : prev.against,
            }));

            // Add to Audit Log
            const block = await event.getBlock();
            const newLogItem = {
                txHash: event.hash,
                voter: voter,
                support: support,
                weight: weight.toString(),
                timestamp: new Date(block.timestamp * 1000).toLocaleTimeString(),
                isNew: true, // For UI highlight effect
            };

            setAuditLog((prev) => [newLogItem, ...prev]);
        };

        // Attach listener
        governanceContract.on("Voted", handleNewVote);

        // Cleanup
        return () => {
            isMounted = false;
            governanceContract.off("Voted", handleNewVote);
        };
    }, [governanceContract, proposalId]);

    // ── Chart Config ───────────────────────────────────────
    const chartData = {
        labels: ["Votes For", "Votes Against"],
        datasets: [
            {
                label: "Votes",
                data: [results.for, results.against],
                backgroundColor: ["rgba(16, 185, 129, 0.6)", "rgba(239, 68, 68, 0.6)"],
                borderColor: ["rgba(16, 185, 129, 1)", "rgba(239, 68, 68, 1)"],
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
                text: `Live Results: Proposal #${proposalId ?? "-"}`,
                color: "#94a3b8",
                font: { size: 16 },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: "#cbd5e1", precision: 0 },
                grid: { color: "#334155" },
            },
            x: {
                ticks: { color: "#cbd5e1" },
                grid: { display: false },
            },
        },
    };

    // ── Render ─────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-cyan-400 animate-pulse">
                Loading blockchain data...
            </div>
        );
    }

    if (proposalId === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-up">
                <div className="text-6xl mb-4">🗳️</div>
                <h2 className="text-xl font-bold text-white mb-2">
                    Waiting for Election to Start
                </h2>
                <p className="text-slate-400">
                    No proposals found on the blockchain yet.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-up">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-8">
                Live Election Dashboard
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ── Left Column: Chart ──────────────────────── */}
                <div className="glass p-6">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="text-emerald-400">📊</span> Real-Time Tally
                    </h2>
                    <div className="h-64 sm:h-80">
                        <Bar options={chartOptions} data={chartData} />
                    </div>
                </div>

                {/* ── Right Column: Audit Log ────────────────── */}
                <div className="glass p-6 flex flex-col h-[500px]">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="text-amber-400">📜</span> Transparent Audit Trail
                        <span className="ml-auto text-xs font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded-full animate-pulse">
                            ● Live Feed
                        </span>
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {auditLog.length === 0 ? (
                            <p className="text-center text-slate-500 mt-10 italic">
                                No votes cast yet. Be the first!
                            </p>
                        ) : (
                            auditLog.map((log, index) => (
                                <div
                                    key={log.txHash} // Ensure logs have unique keys
                                    className={`p-3 rounded-lg border border-slate-700/50 bg-slate-800/40 flex items-center gap-3 transition-all duration-500 ${log.isNew ? "bg-emerald-500/20 border-emerald-500/50" : ""
                                        }`}
                                >
                                    <div
                                        className={`w-2 h-full rounded-l-lg self-stretch ${log.support ? "bg-emerald-500" : "bg-red-500"
                                            }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span
                                                className={`text-sm font-bold ${log.support ? "text-emerald-300" : "text-red-300"
                                                    }`}
                                            >
                                                {log.support ? "Voted FOR" : "Voted AGAINST"}
                                            </span>
                                            <span className="text-xs text-slate-500 font-mono">
                                                {log.timestamp}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-400 font-mono truncate">
                                            <span className="text-slate-500">Wallet: </span>
                                            {log.voter.substring(0, 6)}...{log.voter.substring(38)}
                                        </div>
                                        <div className="text-[10px] text-slate-600 font-mono truncate mt-0.5">
                                            Tx: {log.txHash}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
