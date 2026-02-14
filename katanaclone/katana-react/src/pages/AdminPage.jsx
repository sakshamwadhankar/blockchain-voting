import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ethers } from 'ethers'
import { useWallet } from '../context/WalletContext'
import { STATE_LABELS } from '../config/contracts'
import SectionParticles from '../components/SectionParticles'
import StarField from '../components/StarField'

export default function AdminPage() {
    const { account, governance, connect } = useWallet()
    const [proposals, setProposals] = useState([])
    const [loading, setLoading] = useState(true)
    const [executing, setExecuting] = useState(null)
    const [txStatus, setTxStatus] = useState({ type: '', message: '' })

    const fetchProposals = useCallback(async () => {
        if (!governance) return
        setLoading(true)
        try {
            const count = await governance.nextProposalId()
            const items = []
            for (let i = 0; i < Number(count); i++) {
                const p = await governance.getProposal(i)
                const s = await governance.state(i)
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
                })
            }
            setProposals(items.reverse())
        } catch (err) {
            console.error('Admin fetch:', err)
        }
        setLoading(false)
    }, [governance])

    useEffect(() => { fetchProposals() }, [fetchProposals])

    const handleExecute = async (id) => {
        setExecuting(id)
        setTxStatus({ type: '', message: '' })
        try {
            const tx = await governance.execute(id)
            setTxStatus({ type: 'info', message: `executing proposal #${id}...` })
            await tx.wait()
            setTxStatus({ type: 'success', message: `✓ proposal #${id} executed! TX: ${tx.hash.slice(0, 16)}...` })
            fetchProposals()
        } catch (err) {
            setTxStatus({ type: 'error', message: err.reason || err.message })
        }
        setExecuting(null)
    }

    const handleCancel = async (id) => {
        setExecuting(id)
        setTxStatus({ type: '', message: '' })
        try {
            const tx = await governance.cancel(id)
            setTxStatus({ type: 'info', message: `cancelling proposal #${id}...` })
            await tx.wait()
            setTxStatus({ type: 'success', message: `✓ proposal #${id} cancelled.` })
            fetchProposals()
        } catch (err) {
            setTxStatus({ type: 'error', message: err.reason || err.message })
        }
        setExecuting(null)
    }

    const formatEth = (wei) => {
        try { return ethers.formatEther(wei) } catch { return '0' }
    }

    const stateColor = (state) => {
        const colors = {
            Pending: { bg: 'rgba(234,179,8,0.12)', color: '#facc15' },
            Active: { bg: 'rgba(34,211,238,0.12)', color: '#22d3ee' },
            Succeeded: { bg: 'rgba(74,222,128,0.12)', color: '#4ade80' },
            Defeated: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
            Executed: { bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
            Cancelled: { bg: 'rgba(252,252,252,0.06)', color: 'rgba(252,252,252,0.4)' },
        }
        return colors[state] || { bg: 'rgba(252,252,252,0.06)', color: 'rgba(252,252,252,0.5)' }
    }

    // No wallet
    if (!account) {
        return (
            <div className="page-wrapper">
                <StarField />
                <div className="page-content">
                    <SectionParticles variant="gold" density={30} />
                    <div className="page-header">
                        <Link to="/" className="page-back">← back to home</Link>
                        <h1 className="typo-h1" style={{ color: '#F6FF0D' }}>admin access</h1>
                        <p className="page-subtitle">connect the owner wallet to manage governance proposals</p>
                    </div>
                    <div className="page-grid" style={{ justifyContent: 'center' }}>
                        <div className="page-card" style={{ textAlign: 'center', maxWidth: '500px' }}>
                            <div className="page-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#F6FF0D" strokeWidth="1.5">
                                    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                                </svg>
                            </div>
                            <h3 className="typo-h4">🔐 admin access required</h3>
                            <p>connect the owner wallet to manage proposals.</p>
                            <button className="btn btn--important" style={{ marginTop: '20px' }} onClick={connect}>
                                <span className="btn-inner"><span>connect wallet</span></span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const stats = [
        { label: 'Total', value: proposals.length, color: '#818cf8' },
        { label: 'Active', value: proposals.filter((p) => p.state === 'Active').length, color: '#22d3ee' },
        { label: 'Succeeded', value: proposals.filter((p) => p.state === 'Succeeded').length, color: '#4ade80' },
        { label: 'Executed', value: proposals.filter((p) => p.state === 'Executed').length, color: '#F6FF0D' },
    ]

    return (
        <div className="page-wrapper">
            <StarField />
            <div className="page-content">
                <SectionParticles variant="gold" density={30} />
                <div className="page-header">
                    <Link to="/" className="page-back">← back to home</Link>
                    <h1 className="typo-h1" style={{ color: '#F6FF0D' }}>admin panel</h1>
                    <p className="page-subtitle">execute succeeded proposals and manage governance</p>
                    <button className="btn btn--smaller" onClick={fetchProposals} disabled={loading} style={{ marginTop: '12px' }}>
                        <span className="btn-inner"><span>{loading ? '⏳' : '↻'} refresh</span></span>
                    </button>
                </div>

                {/* Status */}
                {txStatus.message && (
                    <div className={`page-status-message ${txStatus.type}`}>
                        {txStatus.message}
                    </div>
                )}

                {/* Stats */}
                <div className="page-admin-stats">
                    {stats.map(({ label, value, color }) => (
                        <div key={label} className="page-stat-card">
                            <span className="page-stat-value" style={{ color }}>{value}</span>
                            <span className="page-stat-label">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Proposals Table */}
                <div className="page-admin-section">
                    <div className="page-admin-section-header">
                        <h3 className="typo-h4">all proposals</h3>
                        <span style={{ fontSize: '13px', opacity: 0.4 }}>
                            wallet: {account.substring(0, 6)}...{account.substring(38)}
                        </span>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <div className="page-spinner"></div>
                            <p style={{ opacity: 0.5, marginTop: '16px' }}>loading proposals...</p>
                        </div>
                    ) : proposals.length === 0 ? (
                        <p style={{ textAlign: 'center', opacity: 0.4, padding: '48px 0' }}>no proposals found</p>
                    ) : (
                        <div className="page-admin-table">
                            <div className="page-table-header">
                                <span>proposal</span>
                                <span>state</span>
                                <span>votes</span>
                                <span>actions</span>
                            </div>
                            {proposals.map((p) => {
                                const sc = stateColor(p.state)
                                return (
                                    <div key={p.id} className="page-table-row">
                                        <div>
                                            <span style={{ opacity: 0.4, marginRight: '8px' }}>#{p.id}</span>
                                            <span>{p.description}</span>
                                            {p.amount > 0n && (
                                                <span style={{ fontSize: '11px', opacity: 0.4, marginLeft: '8px' }}>
                                                    💰 {formatEth(p.amount)} ETH
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <span style={{
                                                fontSize: '12px', padding: '3px 10px', borderRadius: '999px',
                                                background: sc.bg, color: sc.color,
                                            }}>
                                                {p.state}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', opacity: 0.6 }}>
                                            <span style={{ color: '#4ade80' }}>{formatEth(p.forVotes)}</span>
                                            <span style={{ margin: '0 4px' }}>/</span>
                                            <span style={{ color: '#f87171' }}>{formatEth(p.againstVotes)}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {p.state === 'Succeeded' && (
                                                <button className="btn btn--important btn--smaller" onClick={() => handleExecute(p.id)} disabled={executing === p.id}>
                                                    <span className="btn-inner"><span>{executing === p.id ? '...' : '⚡ execute'}</span></span>
                                                </button>
                                            )}
                                            {!p.executed && !p.cancelled && (
                                                <button className="btn btn--smaller" onClick={() => handleCancel(p.id)} disabled={executing === p.id} style={{ color: '#f87171' }}>
                                                    <span className="btn-inner"><span>cancel</span></span>
                                                </button>
                                            )}
                                            {(p.executed || p.cancelled) && (
                                                <span style={{ fontSize: '12px', opacity: 0.3 }}>—</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
