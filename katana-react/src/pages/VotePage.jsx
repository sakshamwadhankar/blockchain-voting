import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWallet } from '../context/WalletContext'
import ElectionService from '../services/electionService'
import FirebaseService from '../services/firebaseService'
import { GOVERNANCE_ADDRESS } from '../config/contracts'
import SectionParticles from '../components/SectionParticles'
import StarField from '../components/StarField'

const electionService = new ElectionService(GOVERNANCE_ADDRESS)

export default function VotePage() {
    const { user, isVerified, voterToken } = useAuth()
    const { account } = useWallet()
    const navigate = useNavigate()

    const [elections, setElections] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedElection, setSelectedElection] = useState(null)
    const [candidates, setCandidates] = useState([])
    const [castingVote, setCastingVote] = useState(false)
    const [voteStatus, setVoteStatus] = useState(null)

    const fetchProposals = useCallback(async () => {
        if (!governance) return
        setLoading(true)
        try {
            const count = await governance.nextProposalId()
            const items = []
            for (let i = 0; i < Number(count); i++) {
                const p = await governance.getProposal(i)
                const s = await governance.state(i)
                let voted = false
                if (account) {
                    try { voted = await governance.hasVoted(i, account) } catch { }
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
                    state: STATE_LABELS[Number(s)] || 'Unknown',
                    hasVoted: voted,
                })
            }
            setProposals(items.reverse())
        } catch (err) {
            console.error('Fetch proposals:', err)
        }
        setLoading(false)
    }, [governance, account])

    useEffect(() => { fetchProposals() }, [fetchProposals])

    const handleVote = async (id, support) => {
        setVoting(id)
        setTxStatus({ type: '', message: '' })
        try {
            const tx = await governance.vote(id, support)
            setTxStatus({ type: 'info', message: `TX submitted: ${tx.hash.slice(0, 12)}...` })
            await tx.wait()
            setTxStatus({ type: 'success', message: `vote recorded! ${support ? '✓ FOR' : '✗ AGAINST'}` })
            fetchProposals()
        } catch (err) {
            setTxStatus({ type: 'error', message: err.reason || err.message })
        }
        setVoting(null)
    }

    const formatTime = (ts) => ts ? new Date(ts * 1000).toLocaleString() : '—'
    const formatEth = (wei) => {
        try { return ethers.formatEther(wei) } catch { return '0' }
    }

    if (!account) {
        return (
            <div className="page-wrapper">
                <StarField />
                <div className="page-content">
                    <SectionParticles variant="yellow" density={50} />
                    <div className="page-header">
                        <Link to="/" className="page-back">← back to home</Link>
                        <h1 className="typo-h1" style={{ color: '#F6FF0D' }}>voting booth</h1>
                        <p className="page-subtitle">connect MetaMask to view and vote on proposals</p>
                    </div>
                    <div className="page-grid" style={{ justifyContent: 'center' }}>
                        <div className="page-card" style={{ textAlign: 'center', maxWidth: '500px' }}>
                            <div className="page-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#F6FF0D" strokeWidth="1.5">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="typo-h4">wallet required</h3>
                            <p>connect your MetaMask wallet to participate in KWOTE voting.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page-wrapper">
            <StarField />
            <div className="page-content">
                <SectionParticles variant="yellow" density={50} />
                <div className="page-header">
                    <Link to="/" className="page-back">← back to home</Link>
                    <h1 className="typo-h1" style={{ color: '#F6FF0D' }}>voting booth</h1>
                    <p className="page-subtitle">cast your vote on active proposals</p>
                </div>

                {txStatus.message && (
                    <div className={`page-status-message ${txStatus.type}`} style={{ marginBottom: '32px' }}>
                        {txStatus.message}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div className="page-spinner" style={{ margin: '0 auto 16px' }}></div>
                        <p style={{ opacity: 0.5 }}>loading proposals...</p>
                    </div>
                ) : proposals.length === 0 ? (
                    <div className="page-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
                        <h3 className="typo-h3" style={{ marginBottom: '8px' }}>no proposals yet</h3>
                        <p style={{ opacity: 0.6 }}>check back later or contact your administrator</p>
                    </div>
                ) : (
                    <div className="page-proposals">
                        {proposals.map((p) => (
                            <div key={p.id} className={`page-proposal-card ${p.state.toLowerCase()}`}>
                                <div className="page-proposal-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.5 }}>#{p.id}</span>
                                        <span className={`page-proposal-status ${p.state.toLowerCase()}`}>
                                            {p.state}
                                        </span>
                                    </div>
                                    <span className="page-proposal-time">ends {formatTime(p.endTime)}</span>
                                </div>

                                <h3 className="typo-h4" style={{ margin: '12px 0', lineHeight: 1.4 }}>{p.description}</h3>

                                {p.amount > 0 && (
                                    <p style={{ fontSize: '13px', opacity: 0.6, marginBottom: '12px' }}>
                                        💰 {formatEth(p.amount)} ETH → <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{p.recipient?.slice(0, 10)}...</span>
                                    </p>
                                )}

                                <div className="page-proposal-stats">
                                    <span>for: {formatEth(p.forVotes)} tokens</span>
                                    <span>against: {formatEth(p.againstVotes)} tokens</span>
                                </div>

                                <div className="page-proposal-progress">
                                    {(Number(p.forVotes) + Number(p.againstVotes)) > 0 && (
                                        <div className="page-proposal-bar" style={{
                                            width: `${(Number(p.forVotes) / (Number(p.forVotes) + Number(p.againstVotes))) * 100}%`,
                                            background: 'linear-gradient(90deg, #4ade80, #F6FF0D)'
                                        }}></div>
                                    )}
                                </div>

                                {p.state === 'Active' && !p.hasVoted && (
                                    <div className="page-proposal-actions">
                                        <button
                                            className="btn btn--important"
                                            onClick={() => handleVote(p.id, true)}
                                            disabled={voting === p.id}
                                        >
                                            <span className="btn-inner"><span>{voting === p.id ? '...' : '✓ vote for'}</span></span>
                                        </button>
                                        <button
                                            className="btn"
                                            onClick={() => handleVote(p.id, false)}
                                            disabled={voting === p.id}
                                            style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                        >
                                            <span className="btn-inner"><span>{voting === p.id ? '...' : '✗ vote against'}</span></span>
                                        </button>
                                    </div>
                                )}

                                {p.hasVoted && (
                                    <div className="page-vote-receipt">
                                        ✓ you have already voted on this proposal
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
