import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import ElectionService, { ELECTION_MANAGER_ABI } from "../services/electionService";
import FirebaseService from "../services/firebaseService";
import { GOVERNANCE_ADDRESS } from "../config/contracts"; // This is actually ElectionManager Address now

const electionService = new ElectionService(GOVERNANCE_ADDRESS);

export default function VotingBooth() {
    const { user, isVerified, voterToken } = useAuth();
    const { account } = useWallet();
    const navigate = useNavigate();

    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedElection, setSelectedElection] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [castingVote, setCastingVote] = useState(false);
    const [voteStatus, setVoteStatus] = useState(null);

    // ── Load Elections ─────────────────────────────────
    useEffect(() => {
        const loadElections = async () => {
            try {
                if (!window.ethereum) return;
                await electionService.initialize();

                const count = await electionService.getTotalElections();


                // Valid election IDs start at 0
                const startId = 0;
                // Create an array of indices [0, 1, ..., count-1]
                const electionIndices = Array.from({ length: count }, (_, i) => i);

                // Fetch all elections in parallel
                const fetchedElections = await Promise.all(
                    electionIndices.map(async (i) => {
                        // Helper for timeout
                        const withTimeout = (promise, ms = 5000) => {
                            return Promise.race([
                                promise,
                                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
                            ]);
                        };

                        try {
                            // Parallelize fetch of Chain Data and Firebase Data for this election with timeout
                            const [chainData, metaData] = await Promise.all([
                                withTimeout(electionService.getElection(i))
                                    .catch(e => {
                                        console.error(`Failed to load chain data for ${i}`, e);
                                        return null;
                                    }),
                                withTimeout(FirebaseService.getElectionMetadata(i))
                                    .catch(e => {
                                        console.warn(`No metadata for election ${i}`, e);
                                        return {};
                                    })
                            ]);

                            if (!chainData) return null;
                            if (metaData.isDeleted) return null; // Filter out deleted elections

                            return {
                                id: i,
                                ...chainData,
                                ...metaData, // Merges title, description, bannerUrl
                                position: chainData.position || metaData?.title || "Untitled Election"
                            };
                        } catch (err) {
                            console.error(`Failed to load election ${i}`, err);
                            return null;
                        }
                    })
                );

                // Filter out any nulls from failed fetches or deleted elections
                setElections(fetchedElections.filter(e => e !== null));
            } catch (err) {
                console.error("Failed to load elections:", err);
                setError("Failed to load active elections. Is MetaMask connected?");
            } finally {
                setLoading(false);
            }
        };

        loadElections();
    }, []);

    // ── Load Candidates for Selected Election ──────────
    useEffect(() => {
        if (!selectedElection) return;

        const loadCandidates = async () => {
            setLoading(true);
            setCandidates([]); // Clear previous
            try {
                // 1. Fetch from Blockchain
                const chainCandidates = await electionService.getAllCandidates(selectedElection.id);

                // 2. Fetch from Firebase
                const fireCandidates = await FirebaseService.getCandidates(selectedElection.id);

                // 3. Merge
                const merged = chainCandidates.map(c => {
                    // Try to find matching firebase doc. 
                    // Assumption: Firebase candidate docs might use same ID, or we match by logic.
                    // For now, let's assume we can match by ID if we stored it that way, 
                    // or just use what we have. 
                    // If addCandidate was done via UI, Firebase likely has a doc with ID = candidateId
                    const meta = fireCandidates.find(fc => fc.candidateId == c.id) || {};
                    return { ...c, ...meta };
                });

                setCandidates(merged);
            } catch (err) {
                console.error("Failed to load candidates:", err);
            } finally {
                setLoading(false);
            }
        };

        loadCandidates();
    }, [selectedElection]);

    // ── Handle Vote ────────────────────────────────────
    const handleVote = async (candidateId, candidateName) => {
        if (!isVerified || !voterToken) {
            if (confirm("You need to verify your identity to vote. Go to verification?")) {
                navigate("/verify-identity");
            }
            return;
        }

        if (!user?.employeeId) {
            alert("Employee ID missing from session. Please relogin.");
            return;
        }

        setCastingVote(true);
        setVoteStatus({ type: "info", message: `Casting vote for ${candidateName}... Confirm in wallet.` });

        try {
            const txHash = await electionService.castVote(
                selectedElection.id,
                candidateId,
                user.employeeId,
                voterToken
            );

            setVoteStatus({ type: "success", message: `Vote cast successfully! TX: ${txHash.slice(0, 10)}...` });

            // Log vote to Firebase Audit (Backend does this via event listener usually, but we can do it here optimistically or via service)
            // For now, rely on blockchain event + backend listener

        } catch (err) {
            console.error("Voting failed:", err);
            let msg = "Voting failed. Check console.";
            if (err.message && err.message.includes("HasVoted")) msg = "You have already voted in this election.";
            if (err.message && err.message.includes("ElectionNotActive")) msg = "Election is not active.";

            setVoteStatus({ type: "error", message: msg });
        } finally {
            setCastingVote(false);
        }
    };

    // ── Render Helpers ─────────────────────────────────
    const needsVerification = !isVerified || !voterToken;

    if (loading && elections.length === 0 && !selectedElection) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (selectedElection) {
        // ── Detail View ────────────────────────────────
        return (
            <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-up">
                <button
                    onClick={() => {
                        setSelectedElection(null);
                        setVoteStatus(null);
                    }}
                    className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    ← Back to Elections
                </button>

                <div className="relative rounded-2xl overflow-hidden mb-8 aspect-[21/9] group shadow-2xl shadow-indigo-500/10">
                    <img
                        src={selectedElection.bannerUrl || "https://images.unsplash.com/photo-1540910419868-474947cebacb?auto=format&fit=crop&q=80"}
                        alt="Election Banner"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent flex flex-col justify-end p-8">
                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 w-fit ${selectedElection.isActive ? "bg-emerald-500 text-emerald-950" : "bg-red-500 text-white"
                            }`}>
                            {selectedElection.isActive ? "ACTIVE ELECTION" : "CLOSED"}
                        </span>
                        <h1 className="text-4xl font-bold text-white mb-2">{selectedElection.position}</h1>
                        <p className="text-slate-300 max-w-2xl">{selectedElection.description || "Cast your vote for the future of our organization."}</p>
                    </div>
                </div>

                {needsVerification && selectedElection.isActive && (
                    <div className="mb-8 p-6 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-amber-400 font-bold text-lg flex items-center gap-2">
                                <span>⚠️</span> Identity Verification Required
                            </h3>
                            <p className="text-amber-200/70 text-sm mt-1">
                                You must verify your identity and obtain a secure voter token to cast a vote in this election.
                            </p>
                        </div>
                        <Link
                            to="/verify-identity"
                            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors whitespace-nowrap"
                        >
                            Verify Now →
                        </Link>
                    </div>
                )}

                {voteStatus && (
                    <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 ${voteStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                        voteStatus.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                            'bg-blue-500/10 border-blue-500/30 text-blue-300'
                        }`}>
                        <div className="text-2xl">
                            {voteStatus.type === 'success' ? '✅' : voteStatus.type === 'error' ? '❌' : 'ℹ️'}
                        </div>
                        <p>{voteStatus.message}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {candidates.map((candidate) => (
                        <div key={candidate.id} className="glass p-6 group hover:border-indigo-500/50 transition-all duration-300 flex flex-col">
                            <div className="flex items-start gap-4 mb-4">
                                <img
                                    src={candidate.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`}
                                    alt={candidate.name}
                                    className="w-16 h-16 rounded-full bg-slate-700 object-cover border-2 border-slate-600/50"
                                />
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                                        {candidate.name}
                                    </h3>
                                    <p className="text-sm text-slate-400">{candidate.department || "Independent candidate"}</p>
                                </div>
                            </div>

                            <p className="text-slate-300 text-sm mb-6 line-clamp-3">
                                {candidate.bio || "No biography provided."}
                            </p>

                            <div className="flex gap-3 mt-auto">
                                {candidate.manifestoUrl || candidate.manifestoIPFS ? (
                                    <a
                                        href={candidate.manifestoUrl || candidate.manifestoIPFS}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 text-center transition-colors"
                                    >
                                        📄 Manifesto
                                    </a>
                                ) : (
                                    <button disabled className="flex-1 px-4 py-2 rounded-lg border border-slate-800 text-slate-600 text-sm font-medium cursor-not-allowed">
                                        No Manifesto
                                    </button>
                                )}

                                <button
                                    onClick={() => handleVote(candidate.id, candidate.name)}
                                    disabled={!selectedElection.isActive || castingVote || needsVerification || voteStatus?.type === 'success'}
                                    className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    {castingVote ? "Voting..." : "Vote"}
                                </button>
                            </div>
                        </div>
                    ))}

                    {candidates.length === 0 && !loading && (
                        <div className="col-span-full py-10 text-center text-slate-500 italic">
                            No candidates found for this election.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── List View ──────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        Voting Booth
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Participate in active secure elections. Your vote is anonymous and immutable.
                    </p>
                </div>
                {!isVerified && (
                    <Link to="/verify-identity" className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-slate-300 transition-all w-fit">
                        <span>⚠️ Unverified</span>
                        <span className="text-xs ml-2 text-indigo-400">Verify Now →</span>
                    </Link>
                )}
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl">
                    {error}
                </div>
            )}

            {elections.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-slate-700/50 border-dashed">
                    <p className="text-2xl text-slate-500 mb-2">No active elections found</p>
                    <p className="text-slate-600">Check back later for new voting sessions.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {elections.map((election) => (
                        <div
                            key={election.id}
                            onClick={() => setSelectedElection(election)}
                            className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-500 shadow-xl shadow-black/20 bg-slate-900"
                        >
                            {election.bannerUrl ? (
                                <img
                                    src={election.bannerUrl}
                                    alt={election.position}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                        e.target.style.display = 'none'; // Hide broken image
                                        // The background gradient (below) will show through if we structure it right, 
                                        // or we could set a fallback src, but user asked for "different UI".
                                        // For now, hiding it reveals the parent bg-slate-900.
                                    }}
                                />
                            ) : (
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-indigo-900/40 group-hover:scale-110 transition-transform duration-700">
                                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400 via-cyan-400 to-transparent"></div>
                                    <div className="absolute bottom-0 right-0 p-10 opacity-20">
                                        <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" className="text-white transform rotate-12">
                                            <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent p-6 flex flex-col justify-end">
                                <Link
                                    to={`/results/${election.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute top-4 right-4 p-2 bg-slate-900/50 hover:bg-slate-900/80 backdrop-blur-md rounded-lg text-slate-300 hover:text-white transition-colors z-10"
                                    title="View Results"
                                >
                                    📊
                                </Link>

                                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 ${election.isActive ? 'bg-emerald-500 text-emerald-950' : 'bg-red-500 text-white'
                                        }`}>
                                        {election.isActive ? "🟢 OPEN" : "🔴 CLOSED"}
                                    </span>
                                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{election.position}</h3>
                                    <p className="text-slate-300 line-clamp-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                        {election.description || "Click to view candidates, read manifestos, and cast your secure vote."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
