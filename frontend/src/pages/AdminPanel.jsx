import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { STATE_LABELS, STATE_COLORS } from "../config/contracts";

export default function AdminPanel() {
    const { account, governance } = useWallet();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(null);
    const [txStatus, setTxStatus] = useState({ type: "", message: "" });

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

    useEffect(() => { fetchProposals(); }, [fetchProposals]);

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
        <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-up">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    Admin Panel
                </h1>
                <p className="text-slate-400 mt-1">Execute succeeded proposals and manage governance</p>
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
                <div className="space-y-3">
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
        </div>
    );
}
