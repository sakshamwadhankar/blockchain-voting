import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebaseConfig';
import ElectionService from "../services/electionService";
import firebaseService from "../services/firebaseService";

export default function FirebaseAdminPanel() {
  const [electionService, setElectionService] = useState(null);
  const [activeTab, setActiveTab] = useState("create");
  
  // Create Election
  const [position, setPosition] = useState("");
  const [duration, setDuration] = useState("7");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  
  // Add Candidates
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
      setMessage({ type: "error", text: "Failed to connect to blockchain" });
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
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    
    if (!position || !duration || !description) {
      setMessage({ type: "error", text: "Please fill all required fields" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Step 1: Create election on blockchain
      const electionId = await electionService.createElection(position, parseInt(duration));
      
      // Step 2: Upload banner to Firebase Storage (if provided)
      let bannerUrl = "";
      if (bannerFile) {
        const storageRef = ref(storage, `election_banners/${electionId}/${bannerFile.name}`);
        await uploadBytes(storageRef, bannerFile);
        bannerUrl = await getDownloadURL(storageRef);
      }
      
      // Step 3: Save metadata to Firestore
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
      
      setPosition("");
      setDuration("7");
      setDescription("");
      setRules("");
      setBannerFile(null);
      await loadElections(electionService);
      
    } catch (error) {
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
    setMessage({ type: "", text: "" });

    try {
      // Step 1: Upload photo to Firebase Storage
      let photoUrl = "";
      if (photoFile) {
        photoUrl = await firebaseService.uploadCandidatePhoto(
          selectedElection,
          employeeId,
          photoFile
        );
      }
      
      // Step 2: Upload manifesto to Firebase Storage
      let manifestoUrl = "";
      if (manifestoFile) {
        manifestoUrl = await firebaseService.uploadManifesto(
          selectedElection,
          employeeId,
          manifestoFile
        );
      }
      
      // Step 3: Add candidate to blockchain
      await electionService.addCandidate(
        parseInt(selectedElection),
        candidateName,
        employeeId,
        department,
        manifestoUrl // Store URL on blockchain
      );
      
      // Step 4: Save candidate profile to Firestore
      const candidateId = elections.find(e => e.id === parseInt(selectedElection))?.candidateCount || 0;
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
      
      setCandidateName("");
      setEmployeeId("");
      setDepartment("");
      setCandidateBio("");
      setPhotoFile(null);
      setManifestoFile(null);
      await loadElections(electionService);
      
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to add candidate" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏢 MNC Election Admin Panel</h1>
          <p className="text-indigo-200">Firebase-Powered Election Management</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === "create"
                ? "bg-indigo-600 text-white"
                : "bg-white/10 text-indigo-200 hover:bg-white/20"
            }`}
          >
            Create Election
          </button>
          <button
            onClick={() => setActiveTab("candidates")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === "candidates"
                ? "bg-indigo-600 text-white"
                : "bg-white/10 text-indigo-200 hover:bg-white/20"
            }`}
          >
            Add Candidates
          </button>
        </div>

        {/* Create Election Tab */}
        {activeTab === "create" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">🗳️ Create New Election</h2>
            
            <form onSubmit={handleCreateElection} className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">Position Title *</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., CEO, Board Member, Department Head"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the election purpose and requirements"
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Voting Rules</label>
                <textarea
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="Enter voting rules and guidelines"
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Duration (days) *</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  max="365"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Election Banner (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files[0])}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg transition-colors"
              >
                {loading ? "Creating..." : "Create Election"}
              </button>
            </form>
          </div>
        )}

        {/* Add Candidates Tab */}
        {activeTab === "candidates" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">👥 Add Candidate with Rich Profile</h2>
            
            <form onSubmit={handleAddCandidate} className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">Select Election *</label>
                <select
                  value={selectedElection}
                  onChange={(e) => setSelectedElection(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose an election --</option>
                  {elections.map((election) => (
                    <option key={election.id} value={election.id} className="bg-slate-800">
                      {election.position} (ID: {election.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">Candidate Name *</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Employee ID *</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="EMP-12345"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Department *</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., Engineering, Sales, Operations"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Biography</label>
                <textarea
                  value={candidateBio}
                  onChange={(e) => setCandidateBio(e.target.value)}
                  placeholder="Candidate's background and qualifications"
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Professional Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Manifesto (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setManifestoFile(e.target.files[0])}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !selectedElection}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg transition-colors"
              >
                {loading ? "Adding..." : "Add Candidate"}
              </button>
            </form>
          </div>
        )}

        {/* Message Display */}
        {message.text && (
          <div className={`mt-6 p-4 rounded-lg ${
            message.type === "success" 
              ? "bg-green-500/20 border border-green-500/30 text-green-200" 
              : "bg-red-500/20 border border-red-500/30 text-red-200"
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
