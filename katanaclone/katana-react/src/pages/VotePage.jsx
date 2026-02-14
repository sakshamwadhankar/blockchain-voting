import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ethers } from 'ethers'
import { useWallet } from '../context/WalletContext'
import { useAuth } from '../context/AuthContext'
import { STATE_LABELS } from '../config/contracts'
import SectionParticles from '../components/SectionParticles'
import StarField from '../components/StarField'

export default function VotePage() {
    const { account, governance, connect } = useWallet()
    const { isVerified } = useAuth()
    const [proposals, setProposals] = useState([])
    const [loading, setLoading] = useState(true)
    const [voting, setVoting] = useState(null)
    const [txStatus, setTxStatus] = useState({ type: '', message: '' })
    const [showNewProposal, setShowNewProposal] = useState(false)
    const [newDesc, setNewDesc] = useState('')
    const [newRecipient, setNewRecipient] = useState('')
    const [newAmount, setNewAmount] = useState('')

    const fetchProposals = useCallback(async () => {
        if (!governance) return
        setLoading(true)
        try {
            const count = await governance.nextProposalId()
            const items = []
            for (let i = 0; i < Number(count); i++) {
                const p = await governance.getProposal(i)
                const s = await governance.state(i)
                const hasVoted = account ? await governance.hasVoted(i, account) : false
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
                    stateIndex: Number(s),
                    hasVoted,
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
            setTxStatus({ type: 'info', message: `sending vote on proposal #${id}...` })
            await tx.wait()
            setTxStatus({ type: 'success', message: `✓ voted ${support ? 'FOR' : 'AGAINST'} proposal #${id}. TX: ${tx.hash.slice(0, 16)}...` })
            fetchProposals()
        } catch (err) {
            setTxStatus({ type: 'error', message: err.reason || err.message })
        }
        setVoting(null)
    }

    const handlePropose = async () => {
        if (!newDesc.trim()) return
        setTxStatus({ type: '', message: '' })
        try {
            const recipient = newRecipient || ethers.ZeroAddress
            const amount = newAmount ? ethers.parseEther(newAmount) : 0n
            const tx = await governance.propose(newDesc, recipient, amount)
            setTxStatus({ type: 'info', message: 'creating proposal on-chain...' })
            await tx.wait()
            setTxStatus({ type: 'success', message: `✓ proposal created! TX: ${tx.hash.slice(0, 16)}...` })
            setNewDesc(''); setNewRecipient(''); setNewAmount(''); setShowNewProposal(false)
            fetchProposals()
        } catch (err) {
            setTxStatus({ type: 'error', message: err.reason || err.message })
        }
    }

    const formatEth = (wei) => {
        try { return ethers.formatEther(wei) } catch { return '0' }
    }

    const timeLeft = (endTime) => {
        const diff = endTime - Math.floor(Date.now() / 1000)
        if (diff <= 0) return 'ended'
        const d = Math.floor(diff / 86400)
        const h = Math.floor((diff % 86400) / 3600)
        return d > 0 ? `${d}d ${h}h left` : `${h}h left`
    }

    // No wallet
    if (!account) {
        return (
            <div className="page-wrapper">
                <StarField />
                <div className="page-content">
                    <SectionParticles variant="blue" density={50} />
                    <div className="page-header">
                        <Link to="/" className="page-back">← back to home</Link>
                        <h1 className="typo-h1" style={{ color: '#F6FF0D' }}>connect wallet</h1>
                        <p className="page-subtitle">connect your MetaMask wallet to access the voting booth</p>
                    </div>
                    <div className="page-grid" style={{ justifyContent: 'center' }}>
                        <div className="page-card" style={{ textAlign: 'center', maxWidth: '500px' }}>
                            <div className="page-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#F6FF0D" strokeWidth="1.5">
                                    <path d="M21 12V7H5a2 2 0 010-4h14v4" />
                                    <path d="M3 5v14a2 2 0 002 2h16v-5" />
                                    <path d="M18 12a2 2 0 100 4 2 2 0 000-4z" />
                                </svg>
                            </div>
                            <h3 className="typo-h4">wallet required</h3>
                            <p>connect your MetaMask wallet to browse proposals and cast your vote.</p>
                            <button className="btn btn--important" style={{ marginTop: '20px' }} onClick={connect}>
                                <span className="btn-inner"><span>connect MetaMask</span></span>
                            </button>
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
                <SectionParticles variant="blue" density={50} />
                <div className="page-header">
                    <Link to="/" className="page-back">← back to home</Link>
                    <h1 className="typo-h1" style={{ color: '#F6FF0D' }}>cast your vote</h1>
                    <p className="page-subtitle">
                        browse active proposals and make your voice count
                        {!isVerified && (
                            <span style={{ display: 'block', color: '#f87171', fontSize: '13px', marginTop: '6px' }}>
                                ⚠️ wallet not verified — <Link to="/verify" style={{ color: '#F6FF0D', textDecoration: 'underline' }}>verify first</Link>
                            </span>
                        )}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
                        <button className="btn btn--important btn--smaller" onClick={() => setShowNewProposal(!showNewProposal)}>
                            <span className="btn-inner"><span>{showNewProposal ? '✕ cancel' : '+ new proposal'}</span></span>
                        </button>
                        <button className="btn btn--smaller" onClick={fetchProposals} disabled={loading}>
                            <span className="btn-inner"><span>{loading ? '⏳' : '↻'} refresh</span></span>
                        </button>
                    </div>
                </div>

                {/* Status */}
                {txStatus.message && (
                    <div className={`page-status-message ${txStatus.type}`}>
                        {txStatus.message}
                    </div>
                )}

                {/* New Proposal Form */}
                {showNewProposal && (
                    <div className="page-card" style={{ maxWidth: '600px', margin: '0 auto 32px' }}>
                        <h3 className="typo-h4" style={{ marginBottom: '16px' }}>create new proposal</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, display: 'block', marginBottom: '4px' }}>description *</label>
                                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="describe your proposal..." className="page-input" rows={3} style={{ resize: 'vertical', minHeight: '80px' }}></textarea>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, display: 'block', marginBottom: '4px' }}>recipient (optional)</label>
                                    <input type="text" value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)} placeholder="0x..." className="page-input" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, display: 'block', marginBottom: '4px' }}>amount ETH (optional)</label>
                                    <input type="text" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0.0" className="page-input" />
                                </div>
                            </div>
                            <button className="btn btn--important" onClick={handlePropose} disabled={!newDesc.trim()}>
                                <span className="btn-inner"><span>submit proposal →</span></span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Proposals List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div className="page-spinner"></div>
                        <p style={{ opacity: 0.5, marginTop: '16px' }}>loading proposals from blockchain...</p>
                    </div>
                ) : proposals.length === 0 ? (
                    <div className="page-card" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
                        <p style={{ fontSize: '48px', marginBottom: '12px' }}>📋</p>
                        <h3 className="typo-h4">no proposals yet</h3>
                        <p style={{ opacity: 0.6, marginTop: '8px' }}>create the first proposal to get started</p>
                    </div>
                ) : (
                    <div className="page-proposals">
                        {proposals.map((p) => {
                            const totalVotes = Number(formatEth(p.forVotes)) + Number(formatEth(p.againstVotes))
                            const forPct = totalVotes > 0 ? (Number(formatEth(p.forVotes)) / totalVotes * 100).toFixed(0) : 0
                            const isActive = p.state === 'Active'
                            const isEnded = !isActive

                            return (
                                <div key={p.id} className={`page-proposal-card ${isEnded ? 'ended' : ''}`}>
                                    <div className="page-proposal-header">
                                        <span className={`page-proposal-status ${isActive ? 'active' : 'ended'}`}>
                                            {isActive ? '● live' : `○ ${p.state.toLowerCase()}`}
                                        </span>
                                        <span className="page-proposal-time">
                                            <span style={{ opacity: 0.6, marginRight: '8px' }}>#{p.id}</span>
                                            {isActive ? timeLeft(p.endTime) : p.state}
                                        </span>
                                    </div>
                                    <h3 className="typo-h4">{p.description}</h3>
                                    {p.amount > 0n && (
                                        <p style={{ fontSize: '13px', opacity: 0.5, marginTop: '4px' }}>
                                            💰 {formatEth(p.amount)} ETH → {p.recipient?.substring(0, 8)}...
                                        </p>
                                    )}
                                    <div className="page-proposal-stats">
                                        <span>for: {formatEth(p.forVotes)}</span>
                                        <span>against: {formatEth(p.againstVotes)}</span>
                                    </div>
                                    <div className="page-proposal-progress">
                                        <div className="page-proposal-bar" style={{ width: `${forPct}%` }}></div>
                                    </div>

                                    {isActive && !p.hasVoted && (
                                        <div className="page-proposal-actions">
                                            <button className="btn btn--important btn--smaller" onClick={() => handleVote(p.id, true)} disabled={voting === p.id}>
                                                <span className="btn-inner"><span>{voting === p.id ? '...' : 'vote for ✓'}</span></span>
                                            </button>
                                            <button className="btn btn--smaller" onClick={() => handleVote(p.id, false)} disabled={voting === p.id}>
                                                <span className="btn-inner"><span>{voting === p.id ? '...' : 'vote against ✗'}</span></span>
                                            </button>
                                        </div>
                                    )}
                                    {p.hasVoted && (
                                        <div className="page-vote-receipt">
                                            <span>✓ you have already voted on this proposal — cryptographic receipt available</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
