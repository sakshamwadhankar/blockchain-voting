import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebaseConfig';
import { ethers } from 'ethers';

/**
 * Firebase Service for MNC Voting System
 * Handles all Firestore and Storage operations
 */
class FirebaseService {

  // ═══════════════════════════════════════════════════════════════════════════
  // EMPLOYEE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Register a new employee with biometric data
   */
  async registerEmployee(employeeData) {
    const { employeeId, fullName, department, email, phone, faceDescriptor } = employeeData;

    const employeeRef = doc(db, 'employees', employeeId);

    await setDoc(employeeRef, {
      employeeId,
      fullName,
      department,
      email,
      phone,
      faceDescriptor, // 128-dimensional array
      walletAddress: null,
      isVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return employeeId;
  }

  /**
   * Get employee by ID
   */
  async getEmployee(employeeId) {
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);

    if (employeeSnap.exists()) {
      return employeeSnap.data();
    }
    return null;
  }

  /**
   * Verify employee face descriptor
   */
  async verifyEmployeeFace(employeeId, capturedDescriptor) {
    const employee = await this.getEmployee(employeeId);

    if (!employee || !employee.faceDescriptor) {
      return { success: false, message: "Employee not found or no face data" };
    }

    // Calculate Euclidean distance
    const distance = this.calculateDistance(
      employee.faceDescriptor,
      capturedDescriptor
    );

    const threshold = 0.5;
    const isMatch = distance < threshold;

    return {
      success: isMatch,
      distance,
      threshold,
      message: isMatch ? "Face verified successfully" : "Face verification failed"
    };
  }

  /**
   * Bind wallet address to employee
   */
  async bindWallet(employeeId, walletAddress) {
    const employeeRef = doc(db, 'employees', employeeId);

    await updateDoc(employeeRef, {
      walletAddress,
      isVerified: true,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Get employee by wallet address
   */
  async getEmployeeByWallet(walletAddress) {
    const q = query(
      collection(db, 'employees'),
      where('walletAddress', '==', walletAddress)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ELECTION METADATA MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create election metadata (off-chain data)
   */
  async createElectionMetadata(electionData) {
    const {
      electionId,
      title,
      description,
      bannerUrl,
      rules,
      startDate,
      endDate
    } = electionData;

    const electionRef = doc(db, 'elections_metadata', electionId.toString());

    await setDoc(electionRef, {
      electionId,
      title,
      description,
      bannerUrl,
      rules,
      startDate,
      endDate,
      createdAt: serverTimestamp()
    });

    return electionId;
  }

  /**
   * Get election metadata
   */
  async getElectionMetadata(electionId) {
    const electionRef = doc(db, 'elections_metadata', electionId.toString());
    const electionSnap = await getDoc(electionRef);

    if (electionSnap.exists()) {
      return electionSnap.data();
    }
    return null;
  }

  /**
   * Get all elections metadata
   */
  async getAllElectionsMetadata() {
    const electionsRef = collection(db, 'elections_metadata');
    const querySnapshot = await getDocs(electionsRef);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CANDIDATE PROFILE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Upload candidate manifesto to Firebase Storage
   */
  async uploadManifesto(electionId, candidateId, file) {
    const storageRef = ref(
      storage,
      `manifestos/${electionId}/${candidateId}/${file.name}`
    );

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  }

  /**
   * Upload candidate photo
   */
  async uploadCandidatePhoto(electionId, candidateId, file) {
    const storageRef = ref(
      storage,
      `candidate_photos/${electionId}/${candidateId}/${file.name}`
    );

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  }

  /**
   * Save candidate profile with media URLs
   */
  async saveCandidateProfile(electionId, candidateData) {
    const { candidateId, name, bio, photoUrl, manifestoUrl } = candidateData;

    const candidateRef = doc(
      db,
      'elections_metadata',
      electionId.toString(),
      'candidates',
      candidateId.toString()
    );

    await setDoc(candidateRef, {
      candidateId,
      name,
      bio,
      photoUrl,
      manifestoUrl,
      createdAt: serverTimestamp()
    });
  }

  /**
   * Get all candidates for an election
   */
  async getCandidates(electionId) {
    const candidatesRef = collection(db, 'elections_metadata', electionId.toString(), 'candidates');
    const querySnapshot = await getDocs(candidatesRef);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT TRAIL & LOGGING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Log vote to audit trail (human-readable)
   */
  async logVote(voteData) {
    const {
      electionId,
      voterHash,
      candidateId,
      transactionHash,
      blockNumber,
      timestamp
    } = voteData;

    await addDoc(collection(db, 'audit_logs'), {
      electionId,
      voterHash, // Hashed for anonymity
      candidateId,
      transactionHash,
      blockNumber,
      timestamp,
      status: 'Success',
      createdAt: serverTimestamp()
    });
  }

  /**
   * Get audit logs for an election
   */
  async getAuditLogs(electionId, limit = 50) {
    const q = query(
      collection(db, 'audit_logs'),
      where('electionId', '==', electionId)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Listen to real-time audit logs
   */
  onAuditLogsUpdate(electionId, callback) {
    const q = query(
      collection(db, 'audit_logs'),
      where('electionId', '==', electionId)
    );

    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(logs);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate Euclidean distance between two face descriptors
   */
  calculateDistance(descriptor1, descriptor2) {
    if (!descriptor1 || !descriptor2) return Infinity;
    if (descriptor1.length !== descriptor2.length) return Infinity;

    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      const diff = descriptor1[i] - descriptor2[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Hash voter ID for anonymity (Zero-Knowledge simulation)
   */
  hashVoterId(employeeId) {
    return ethers.keccak256(ethers.toUtf8Bytes(employeeId));
  }

  /**
   * Verify wallet is authorized for employee
   */
  async isWalletAuthorized(walletAddress) {
    const employee = await this.getEmployeeByWallet(walletAddress);
    return employee !== null && employee.isVerified;
  }
}

export default new FirebaseService();
