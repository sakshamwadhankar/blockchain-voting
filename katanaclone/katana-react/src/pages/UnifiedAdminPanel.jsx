import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebaseConfig';
import ElectionService from "../services/electionService";
import firebaseService from "../services/firebaseService";

export default function UnifiedAdminPanel() {
    const [electionService, setElectionService] = useState(null);
    const [activeTab, setActiveTab] = useState("create");

    // Create Election Form State
    const [position, setPosition] = useState("");
    const [duration, setDuration] = useState("7");
    const [description, setDescription] = useState("");
    const [rules, setRules] = useState("");
    const [bannerFile, setBannerFile] = useState(null);

    // Add Candidate Form State
    const [elections, setElections] = useState([]);
    const [selectedElection, setSelectedElection] = useState("");
    const [candidateName, setCandidateName] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [department, setDepartment] = useState("");
    const [candidateBio, setCandidateBio] = useState("");
    const [photoFile, setPhotoFile] = useState(null);
    const [manifestoFile, setManifestoFile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        initializeService();
    }, []);

    const initializeService = async () => {
        try {
            const response = await fetch("/deployments/election-localhost.json");
            const deployment = await response.json();

            const service = new ElectionService(deployment.electionManager);
            await service.initialize();
            setElectionService(service);

            await loadElections(service);
        } catch (error) {
            console.error("Initialization error:", error);
            setMessage({ type: "error", text: "Failed to connect to blockchain. Ensure local node is running." });
        }
    };

    const loadElections = async (service) => {
        if (!service) return;
        try {
            const total = await service.getTotalElections();
            const electionList = [];

            for (let i = 0; i < total; i++) {
                const election = await service.getElection(i);
                // Try to fetch metadata from Firebase
                const metadata = await firebaseService.getElectionMetadata(i);

                electionList.push({
                    id: i,
                    ...election,
                    ...metadata // Merge blockchain data with Firebase metadata
                });
            }

            setElections(electionList);
        } catch (error) {
            console.error("Load elections error:", error);
        }
    };

    const handleCreateElection = async (e) => {
        e.preventDefault();

        if (!position || !duration || !description) {
            setMessage({ type: "error", text: "Please fill all required fields" });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "Initializing election creation..." });

        try {
            // Step 1: Create election on blockchain
            setMessage({ type: "info", text: "1/3: Creating election on blockchain..." });
            const electionId = await electionService.createElection(position, parseInt(duration));

            // Step 2: Upload banner to Firebase Storage (if provided)
            let bannerUrl = "";
            if (bannerFile) {
                setMessage({ type: "info", text: "2/3: Uploading banner image..." });
                const storageRef = ref(storage, `election_banners/${electionId}/${bannerFile.name}-${Date.now()}`);
                await uploadBytes(storageRef, bannerFile);
                bannerUrl = await getDownloadURL(storageRef);
            }

            // Step 3: Save metadata to Firestore
            setMessage({ type: "info", text: "3/3: Saving metadata to database..." });
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + parseInt(duration));

            await firebaseService.createElectionMetadata({
                electionId,
                title: position,
                description,
                bannerUrl,
                rules,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            setMessage({
                type: "success",
                text: `Election created successfully! ID: ${electionId}`
            });

            // Reset form
            setPosition("");
            setDuration("7");
            setDescription("");
            setRules("");
            setBannerFile(null);
            await loadElections(electionService);

        } catch (error) {
            console.error("Create election error:", error);
            setMessage({
                type: "error",
                text: error.message || "Failed to create election"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddCandidate = async (e) => {
        e.preventDefault();

        if (!selectedElection || !candidateName || !employeeId || !department) {
            setMessage({ type: "error", text: "Please fill all required fields" });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "Initializing candidate addition..." });

        try {
            // Step 1: Upload photo to Firebase Storage
            let photoUrl = "";
            if (photoFile) {
                setMessage({ type: "info", text: "1/4: Uploading candidate photo..." });
                photoUrl = await firebaseService.uploadCandidatePhoto(
                    selectedElection,
                    employeeId,
                    photoFile
                );
            }

            // Step 2: Upload manifesto to Firebase Storage
            let manifestoUrl = "";
            if (manifestoFile) {
                setMessage({ type: "info", text: "2/4: Uploading manifesto..." });
                manifestoUrl = await firebaseService.uploadManifesto(
                    selectedElection,
                    employeeId,
                    manifestoFile
                );
            }

            // Step 3: Add candidate to blockchain
            setMessage({ type: "info", text: "3/4: Registering candidate on blockchain..." });
            await electionService.addCandidate(
                parseInt(selectedElection),
                candidateName,
                employeeId,
                department,
                manifestoUrl // Store URL on blockchain as the "manifesto IPFS hash/URL"
            );

            // Step 4: Save candidate profile to Firestore
            setMessage({ type: "info", text: "4/4: Saving candidate profile..." });
            // We need to know the candidate ID. Since blockchain IDs are sequential 0,1,2...
            // and we just added one, we can infer it or we might need to fetch it.
            // For simplicity, we'll assume it's the next index based on current count.
            // A safer way is to read the latest candidate count from chain.
            const updatedElection = await electionService.getElection(parseInt(selectedElection));
            const candidateId = Number(updatedElection.candidateCount) - 1; // ID is 0-indexed

            await firebaseService.saveCandidateProfile(selectedElection, {
                candidateId,
                name: candidateName,
                bio: candidateBio,
                photoUrl,
                manifestoUrl
            });

            setMessage({
                type: "success",
                text: `Candidate ${candidateName} added successfully!`
            });

            // Reset form
            setCandidateName("");
            setEmployeeId("");
            setDepartment("");
            setCandidateBio("");
            setPhotoFile(null);
            setManifestoFile(null);
            await loadElections(electionService);

        } catch (error) {
            console.error("Add candidate error:", error);
            setMessage({
                type: "error",
                text: error.message || "Failed to add candidate"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFinalizeElection = async (electionId) => {
        if (!confirm("Are you sure you want to finalize this election? This cannot be undone.")) {
            return;
        }

        setLoading(true);
        setMessage({ type: "info", text: "Finalizing election on blockchain..." });

        try {
            await electionService.finalizeElection(electionId);
            setMessage({
                type: "success",
                text: "Election finalized and results published!"
            });
            await loadElections(electionService);
        } catch (error) {
            console.error("Finalize error:", error);
            setMessage({
                type: "error",
                text: error.message || "Failed to finalize election"
            });
        } finally {
            setLoading(false);
        }
    };

    const getElectionStatus = (election) => {
        const now = Date.now() / 1000;
        if (now < election.startTime) return { label: "Upcoming", color: "bg-yellow-500", style: "border-yellow-500/50 text-yellow-200" };
        if (now > election.endTime && !election.resultsPublished) return { label: "Ended - Pending Finalization", color: "bg-orange-500", style: "border-orange-500/50 text-orange-200" };
        if (election.resultsPublished) return { label: "Finalized", color: "bg-gray-500", style: "border-gray-500/50 text-gray-200" };
        return { label: "Active", color: "bg-green-500", style: "border-green-500/50 text-green-200" };
    };

    return (
        <div className="min-h-screen bg-slate-900 p-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">

                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                        <p className="text-slate-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Unified Blockchain & Firebase Control Center
                        </p>
                    </div>

                    {/* Stats/Quick Actions can go here */}
                    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-300">
                        Connected Network: <span className="text-green-400 font-mono">Localhost</span>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-indigo-500/20">
                    <button
                        onClick={() => setActiveTab("create")}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${activeTab === "create"
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 translate-y-[-2px]"
                                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700/50"
                            }`}
                    >
                        <span>🗳️</span> Create Election
                    </button>
                    <button
                        onClick={() => setActiveTab("candidates")}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${activeTab === "candidates"
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 translate-y-[-2px]"
                                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700/50"
                            }`}
                    >
                        <span>👥</span> Add Candidates
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("manage");
                            if (electionService) loadElections(electionService);
                        }}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${activeTab === "manage"
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 translate-y-[-2px]"
                                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700/50"
                            }`}
                    >
                        <span>📊</span> Manage Elections
                    </button>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">

                    {/* CREATE ELECTION TAB */}
                    {activeTab === "create" && (
                        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 border border-slate-700 shadow-xl animate-fade-in-up">
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-700">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xl">
                                    📝
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Create New Election</h2>
                                    <p className="text-slate-400 text-sm">Deploy smart contract and setup database metadata</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateElection} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-slate-300 font-medium mb-2">Position / Title *</label>
                                        <input
                                            type="text"
                                            value={position}
                                            onChange={(e) => setPosition(e.target.value)}
                                            placeholder="e.g. CEO, CTO, Board Member"
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 font-medium mb-2">Duration (Days) *</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={duration}
                                                onChange={(e) => setDuration(e.target.value)}
                                                min="1"
                                                max="365"
                                                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            />
                                            <span className="absolute right-4 top-3 text-slate-500 text-sm">Days</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 font-medium mb-2">Banner Image</label>
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setBannerFile(e.target.files[0])}
                                                className="hidden"
                                                id="banner-upload"
                                            />
                                            <label
                                                htmlFor="banner-upload"
                                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-slate-700/30 transition-all"
                                            >
                                                {bannerFile ? (
                                                    <div className="text-center">
                                                        <span className="text-indigo-400 font-medium">{bannerFile.name}</span>
                                                        <p className="text-slate-500 text-xs mt-1">Click to change</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-slate-400 group-hover:text-indigo-300">
                                                        <span className="text-2xl mb-2 block">🖼️</span>
                                                        <span className="text-sm font-medium">Click to upload banner</span>
                                                        <p className="text-xs mt-1 opacity-70">PNG, JPG up to 5MB</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-slate-300 font-medium mb-2">Description *</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="What is this election for?"
                                            rows={4}
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 font-medium mb-2">Rules & Guidelines</label>
                                        <textarea
                                            value={rules}
                                            onChange={(e) => setRules(e.target.value)}
                                            placeholder="e.g. One vote per verified employee..."
                                            rows={3}
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 mt-4 pt-6 border-t border-slate-700">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>🚀 Launch Election</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ADD CANDIDATE TAB */}
                    {activeTab === "candidates" && (
                        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 border border-slate-700 shadow-xl animate-fade-in-up">
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-700">
                                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-xl">
                                    👤
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Add Candidate</h2>
                                    <p className="text-slate-400 text-sm">Register candidate and upload profile data</p>
                                </div>
                            </div>

                            <form onSubmit={handleAddCandidate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-slate-300 font-medium mb-2">Select Election *</label>
                                    <select
                                        value={selectedElection}
                                        onChange={(e) => setSelectedElection(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="">-- Choose an election --</option>
                                        {elections.map((election) => (
                                            <option key={election.id} value={election.id} className="bg-slate-800 text-white">
                                                {election.position || `Election #${election.id}`} (Status: {getElectionStatus(election).label})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-slate-300 font-medium mb-2">Candidate Name *</label>
                                        <input
                                            type="text"
                                            value={candidateName}
                                            onChange={(e) => setCandidateName(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 font-medium mb-2">Employee ID *</label>
                                        <input
                                            type="text"
                                            value={employeeId}
                                            onChange={(e) => setEmployeeId(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 font-medium mb-2">Department *</label>
                                        <input
                                            type="text"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-slate-300 font-medium mb-2">Biography</label>
                                        <textarea
                                            value={candidateBio}
                                            onChange={(e) => setCandidateBio(e.target.value)}
                                            rows={4}
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-slate-300 font-medium mb-2">Photo</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setPhotoFile(e.target.files[0])}
                                                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-600 file:text-white hover:file:bg-pink-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 font-medium mb-2">Manifesto (PDF)</label>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => setManifestoFile(e.target.files[0])}
                                                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-600 file:text-white hover:file:bg-pink-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 mt-4 pt-6 border-t border-slate-700">
                                    <button
                                        type="submit"
                                        disabled={loading || !selectedElection}
                                        className="w-full bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-600/20 transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Adding Candidate...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>➕ Register Candidate</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* MANAGE ELECTIONS TAB */}
                    {activeTab === "manage" && (
                        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 border border-slate-700 shadow-xl animate-fade-in-up">
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-700">
                                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xl">
                                    📊
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Manage Elections</h2>
                                    <p className="text-slate-400 text-sm">View status, finalize results, and monitor voting</p>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {elections.map((election) => {
                                    const status = getElectionStatus(election);
                                    const canFinalize = Date.now() / 1000 > election.endTime && !election.resultsPublished;

                                    return (
                                        <div key={election.id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-xl font-bold text-white">{election.position || `Election #${election.id}`}</h3>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${status.style} bg-transparent`}>
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-400 text-sm line-clamp-1">{election.description || "No description provided."}</p>
                                                </div>

                                                <div className="flex items-center gap-6 text-sm text-slate-400 bg-slate-800/50 px-4 py-2 rounded-lg">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-bold text-white">{election.candidateCount.toString()}</span>
                                                        <span className="text-[10px] uppercase tracking-wider">Candidates</span>
                                                    </div>
                                                    <div className="w-px h-8 bg-slate-700"></div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-bold text-white">{election.totalVotes.toString()}</span>
                                                        <span className="text-[10px] uppercase tracking-wider">Votes</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-4 text-sm mb-6">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <span>📅 Start:</span>
                                                    <span className="text-white bg-slate-800 px-2 py-0.5 rounded">{new Date(Number(election.startTime) * 1000).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <span>🏁 End:</span>
                                                    <span className="text-white bg-slate-800 px-2 py-0.5 rounded">{new Date(Number(election.endTime) * 1000).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {canFinalize && (
                                                <button
                                                    onClick={() => handleFinalizeElection(election.id)}
                                                    disabled={loading}
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <span>✅ Finalize Election & Publish Results</span>
                                                </button>
                                            )}

                                            {election.resultsPublished && (
                                                <div className="w-full bg-green-900/20 border border-green-900/50 text-green-300 font-medium py-3 rounded-lg text-center">
                                                    Results Published
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {elections.length === 0 && (
                                    <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-700 rounded-2xl">
                                        <p className="text-slate-500 text-lg">No elections found.</p>
                                        <button onClick={() => setActiveTab("create")} className="text-indigo-400 hover:text-indigo-300 font-medium mt-2">
                                            Create your first election →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Global Message Toast/Alert */}
                {message.text && (
                    <div className={`fixed bottom-6 right-6 max-w-md w-full p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-slide-in-right z-50 flex items-start gap-3 ${message.type === "success"
                            ? "bg-green-500/10 border-green-500/50 text-green-200"
                            : message.type === "error"
                                ? "bg-red-500/10 border-red-500/50 text-red-200"
                                : "bg-blue-500/10 border-blue-500/50 text-blue-200"
                        }`}>
                        <div className="text-xl">
                            {message.type === "success" && "✅"}
                            {message.type === "error" && "⚠️"}
                            {message.type === "info" && "ℹ️"}
                        </div>
                        <div>
                            <p className="font-medium">{message.text}</p>
                        </div>
                        <button onClick={() => setMessage({ type: "", text: "" })} className="ml-auto text-white/50 hover:text-white">✕</button>
                    </div>
                )}

            </div>
        </div>
    );
}
