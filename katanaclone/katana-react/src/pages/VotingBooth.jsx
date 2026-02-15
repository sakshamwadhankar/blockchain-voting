import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { STATE_LABELS, STATE_COLORS } from "../config/contracts";

export default function VotingBooth() {
    const { account, governance } = useWallet();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // Create Proposal Form
    const [desc, setDesc] = useState("");
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [creating, setCreating] = useState(false);
    const [voting, setVoting] = useState(null); // proposalId being voted on
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
                let voted = false;
                if (account) {
                    try { voted = await governance.hasVoted(i, account); } catch { }
                }
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
                    hasVoted: voted,
                });
            }
            setProposals(items.reverse()); // newest first
        } catch (err) {
            console.error("Fetch proposals:", err);
        }
        setLoading(false);
    }, [governance, account]);

    useEffect(() => { fetchProposals(); }, [fetchProposals]);

    const handleVote = async (id, support) => {
        setVoting(id);
        setTxStatus({ type: "", message: "" });
        try {
            const tx = await governance.vote(id, support);
            setTxStatus({ type: "info", message: `TX submitted: ${tx.hash.slice(0, 12)}...` });
            await tx.wait();
            setTxStatus({ type: "success", message: `Vote recorded! ${support ? "✓ FOR" : "✗ AGAINST"}` });
            fetchProposals();
        } catch (err) {
            setTxStatus({ type: "error", message: err.reason || err.message });
        }
        setVoting(null);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        setTxStatus({ type: "", message: "" });
        try {
            const tx = await governance.propose(
                desc,
                recipient || ethers.ZeroAddress,
                amount ? ethers.parseEther(amount) : 0
            );
            setTxStatus({ type: "info", message: `Creating proposal...` });
            await tx.wait();
            setTxStatus({ type: "success", message: "Proposal created!" });
            setDesc(""); setRecipient(""); setAmount("");
            setShowCreate(false);
            fetchProposals();
        } catch (err) {
            setTxStatus({ type: "error", message: err.reason || err.message });
        }
        setCreating(false);
    };

    const formatTime = (ts) => ts ? new Date(ts * 1000).toLocaleString() : "—";
    const formatEth = (wei) => {
        try { return ethers.formatEther(wei); } catch { return "0"; }
    };

    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 animate-fade-up">
                <div className="glass p-10 text-center max-w-md">
                    <div className="text-5xl mb-4">🗳️</div>
                    <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
                    <p className="text-slate-400">Connect MetaMask to view and vote on proposals.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-up">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        Voting Booth
                    </h1>
                    <p className="text-slate-400 mt-1">Create proposals and cast your vote</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-5 py-2.5 rounded-xl font-semibold cursor-pointer text-sm
                     bg-gradient-to-r from-indigo-500 to-purple-500 text-white
                     hover:from-indigo-400 hover:to-purple-400
                     transition-all duration-300 shadow-lg shadow-indigo-500/20"
                >
                    {showCreate ? "✕ Cancel" : "+ New Proposal"}
                </button>
            </div>

            {/* ── Status Bar ────────────────────────────── */}
            {txStatus.message && (
                <div className={`mb-6 p-4 rounded-xl text-sm ${txStatus.type === "error" ? "bg-red-500/10 border border-red-500/30 text-red-300"
                        : txStatus.type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                            : "bg-indigo-500/10 border border-indigo-500/30 text-indigo-300"
                    }`}>
                    {txStatus.message}
                </div>
            )}

            {/* ── Create Proposal ───────────────────────── */}
            {showCreate && (
                <form onSubmit={handleCreate} className="glass p-6 mb-8 space-y-4 animate-fade-up">
                    <h3 className="text-lg font-semibold text-white">Create Proposal</h3>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Description *</label>
                        <textarea
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            required
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50
                         text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60
                         transition-colors resize-none"
                            placeholder="What should this proposal accomplish?"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Recipient Address</label>
                            <input
                                type="text"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                placeholder="0x... (optional)"
                                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50
                           text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60
                           transition-colors font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Amount (ETH)</label>
                            <input
                                type="number"
                                step="0.001"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.0 (optional)"
                                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50
                           text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60
                           transition-colors"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={creating}
                        className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer
                       bg-gradient-to-r from-indigo-500 to-purple-500
                       hover:from-indigo-400 hover:to-purple-400
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-300"
                    >
                        {creating ? "Submitting..." : "Submit Proposal"}
                    </button>
                </form>
            )}

            {/* ── Proposals List ────────────────────────── */}
            {loading ? (
                <div className="text-center py-16">
                    <div className="inline-block w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 mt-4">Loading proposals...</p>
                </div>
            ) : proposals.length === 0 ? (
                <div className="glass p-12 text-center">
                    <div className="text-5xl mb-4">📋</div>
                    <h3 className="text-lg font-semibold text-slate-300">No proposals yet</h3>
                    <p className="text-slate-500">Create the first governance proposal!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {proposals.map((p) => (
                        <div key={p.id} className="glass p-6 animate-fade-up">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500">#{p.id}</span>
                                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATE_COLORS[p.state] || ""}`}>
                                        {p.state}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-500">
                                    Ends {formatTime(p.endTime)}
                                </span>
                            </div>

                            <p className="text-white font-medium mb-3">{p.description}</p>

                            {p.amount > 0 && (
                                <p className="text-sm text-slate-400 mb-3">
                                    💰 {formatEth(p.amount)} ETH → <span className="font-mono text-xs">{p.recipient?.slice(0, 10)}...</span>
                                </p>
                            )}

                            {/* ── Vote Bar ──────────────────── */}
                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>For: {formatEth(p.forVotes)} tokens</span>
                                    <span>Against: {formatEth(p.againstVotes)} tokens</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-700 overflow-hidden flex">
                                    {(Number(p.forVotes) + Number(p.againstVotes)) > 0 && (
                                        <>
                                            <div
                                                className="h-full bg-emerald-400 transition-all duration-500"
                                                style={{
                                                    width: `${(Number(p.forVotes) / (Number(p.forVotes) + Number(p.againstVotes))) * 100}%`,
                                                }}
                                            />
                                            <div
                                                className="h-full bg-red-400 transition-all duration-500"
                                                style={{
                                                    width: `${(Number(p.againstVotes) / (Number(p.forVotes) + Number(p.againstVotes))) * 100}%`,
                                                }}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* ── Vote Buttons ──────────────── */}
                            {p.state === "Active" && !p.hasVoted && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleVote(p.id, true)}
                                        disabled={voting === p.id}
                                        className="flex-1 py-2.5 rounded-xl font-semibold text-sm cursor-pointer
                               bg-emerald-500/15 text-emerald-300 border border-emerald-500/30
                               hover:bg-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed
                               transition-colors"
                                    >
                                        {voting === p.id ? "..." : "✓ Vote For"}
                                    </button>
                                    <button
                                        onClick={() => handleVote(p.id, false)}
                                        disabled={voting === p.id}
                                        className="flex-1 py-2.5 rounded-xl font-semibold text-sm cursor-pointer
                               bg-red-500/15 text-red-300 border border-red-500/30
                               hover:bg-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed
                               transition-colors"
                                    >
                                        {voting === p.id ? "..." : "✗ Vote Against"}
                                    </button>
                                </div>
                            )}

                            {p.hasVoted && (
                                <p className="text-xs text-slate-500 italic">You have already voted on this proposal.</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
