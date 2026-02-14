import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL, STATE_LABELS, STATE_COLORS } from "../config/contracts";

export default function LiveResults() {
    const [proposalId, setProposalId] = useState("0");
    const [proposal, setProposal] = useState(null);
    const [activityLog, setActivityLog] = useState([]);
    const [connected, setConnected] = useState(false);
    const [loadError, setLoadError] = useState("");
    const logEndRef = useRef(null);

    // Socket.io connection
    useEffect(() => {
        const socket = io(BACKEND_URL);

        socket.on("connect", () => setConnected(true));
        socket.on("disconnect", () => setConnected(false));

        socket.on("newVote", (data) => {
            setActivityLog((prev) => [data, ...prev].slice(0, 50));
            // Refresh proposal data if matching
            if (data.proposalId === proposalId) fetchProposal();
        });

        socket.on("newProposal", (data) => {
            setActivityLog((prev) => [{ ...data, type: "proposal" }, ...prev].slice(0, 50));
        });

        return () => socket.disconnect();
    }, [proposalId]);

    const fetchProposal = async () => {
        setLoadError("");
        try {
            const res = await fetch(`${BACKEND_URL}/results/${proposalId}`);
            const data = await res.json();
            if (data.success) {
                setProposal(data.data);
            } else {
                setLoadError(data.message);
                setProposal(null);
            }
        } catch {
            setLoadError("Backend offline. Start the server on port 5000.");
        }
    };

    useEffect(() => { fetchProposal(); }, [proposalId]);

    const totalVotes = proposal ? Number(proposal.forVotes || 0) + Number(proposal.againstVotes || 0) : 0;
    const forPercent = totalVotes > 0 ? ((Number(proposal?.forVotes || 0) / totalVotes) * 100).toFixed(1) : 0;
    const againstPercent = totalVotes > 0 ? ((Number(proposal?.againstVotes || 0) / totalVotes) * 100).toFixed(1) : 0;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 animate-fade-up">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                        Live Results
                    </h1>
                    <p className="text-slate-400 mt-1">Real-time vote streaming dashboard</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                    <span className="text-sm text-slate-400">{connected ? "Live" : "Offline"}</span>
                </div>
            </div>

            {/* ── Proposal Selector ─────────────────────── */}
            <div className="glass p-4 mb-6 flex items-center gap-4">
                <label className="text-sm text-slate-400 whitespace-nowrap">Proposal ID:</label>
                <input
                    type="number"
                    min="0"
                    value={proposalId}
                    onChange={(e) => setProposalId(e.target.value)}
                    className="w-24 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-600/50
                     text-white text-center focus:outline-none focus:border-cyan-500/60 transition-colors"
                />
                <button
                    onClick={fetchProposal}
                    className="px-4 py-2 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30
                     hover:bg-cyan-500/25 text-sm font-semibold transition-colors cursor-pointer"
                >
                    Refresh
                </button>
            </div>

            {loadError && (
                <div className="mb-6 p-4 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-300">
                    {loadError}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Proposal Summary ──────────────────── */}
                <div className="lg:col-span-2">
                    {proposal ? (
                        <div className="glass p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Proposal #{proposal.id}</h2>
                                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATE_COLORS[proposal.state] || ""}`}>
                                    {proposal.state}
                                </span>
                            </div>
                            <p className="text-slate-300">{proposal.description}</p>

                            {/* ── Big Tally ──────────────── */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                    <p className="text-3xl font-bold text-emerald-400">{forPercent}%</p>
                                    <p className="text-sm text-emerald-300/70 mt-1">For</p>
                                    <p className="text-xs text-slate-500 mt-1">{proposal.forVotes} tokens</p>
                                </div>
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                                    <p className="text-3xl font-bold text-red-400">{againstPercent}%</p>
                                    <p className="text-sm text-red-300/70 mt-1">Against</p>
                                    <p className="text-xs text-slate-500 mt-1">{proposal.againstVotes} tokens</p>
                                </div>
                            </div>

                            {/* ── Progress Bar ───────────── */}
                            <div>
                                <div className="h-4 rounded-full bg-slate-700 overflow-hidden flex">
                                    {totalVotes > 0 && (
                                        <>
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                                                style={{ width: `${forPercent}%` }}
                                            />
                                            <div
                                                className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-700"
                                                style={{ width: `${againstPercent}%` }}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Start: {new Date(Number(proposal.startTime) * 1000).toLocaleString()}</span>
                                <span>End: {new Date(Number(proposal.endTime) * 1000).toLocaleString()}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="glass p-12 text-center">
                            <div className="text-5xl mb-4">📊</div>
                            <p className="text-slate-400">Select a proposal to view live results</p>
                        </div>
                    )}
                </div>

                {/* ── Activity Feed ─────────────────────── */}
                <div className="glass p-4 max-h-[500px] flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        Activity Feed
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {activityLog.length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-8">
                                Waiting for live events...
                            </p>
                        ) : (
                            activityLog.map((item, i) => (
                                <div key={i} className="p-3 rounded-lg bg-slate-800/40 text-xs animate-slide-in">
                                    {item.type === "proposal" ? (
                                        <>
                                            <span className="text-indigo-400 font-semibold">📋 New Proposal #{item.id}</span>
                                            <p className="text-slate-400 mt-1 truncate">{item.description}</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-slate-400">{item.voter}</span>
                                                <span className={item.support ? "text-emerald-400" : "text-red-400"}>
                                                    {item.support ? "✓ FOR" : "✗ AGAINST"}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 mt-1">
                                                Proposal #{item.proposalId} · {item.weight} tokens
                                            </p>
                                        </>
                                    )}
                                    <p className="text-slate-600 mt-1">
                                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ""}
                                    </p>
                                </div>
                            ))
                        )}
                        <div ref={logEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
}
