import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useWallet } from '../context/WalletContext'
import { STATE_LABELS, STATE_COLORS, BACKEND_URL } from '../config/contracts'
import SectionParticles from '../components/SectionParticles'
import StarField from '../components/StarField'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function AdminPage() {
    const { account, governance } = useWallet()
    const navigate = useNavigate()
    const [proposals, setProposals] = useState([])
    const [loading, setLoading] = useState(true)
    const [executing, setExecuting] = useState(null)
    const [txStatus, setTxStatus] = useState({ type: '', message: '' })
    const [voterStats, setVoterStats] = useState(null)
    const [electionTitle, setElectionTitle] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [votingDuration, setVotingDuration] = useState(0)
    const [systemConfig, setSystemConfig] = useState({
        votingPeriod: 0,
        quorum: '4%',
        adminWallet: ''
    })

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

    const fetchVoterStats = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/analytics/voters`)
            const data = await res.json()
            if (data.success) {
                setVoterStats(data.data)
            }
        } catch (err) {
            console.error('Analytics fetch error:', err)
        }
    }, [])

    const fetchSystemConfig = useCallback(async () => {
        if (!governance || !account) return
        try {
            const period = await governance.votingPeriod()
            setVotingDuration(Number(period))
            setSystemConfig({
                votingPeriod: Number(period),
                quorum: '4%',
                adminWallet: account
            })
        } catch (err) {
            console.error('Config fetch error:', err)
            setVotingDuration(86400)
            setSystemConfig({
                votingPeriod: 86400,
                quorum: '4%',
                adminWallet: account
            })
        }
    }, [governance, account])

    useEffect(() => {
        fetchProposals()
        fetchVoterStats()
        fetchSystemConfig()
    }, [fetchProposals, fetchVoterStats, fetchSystemConfig])

    const handleExecute = async (id) => {
        setExecuting(id)
        setTxStatus({ type: '', message: '' })
        try {
            const tx = await governance.execute(id)
            setTxStatus({ type: 'info', message: `executing proposal #${id}...` })
            await tx.wait()
            setTxStatus({ type: 'success', message: `proposal #${id} executed! TX: ${tx.hash.slice(0, 16)}...` })
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
            setTxStatus({ type: 'success', message: `proposal #${id} cancelled.` })
            fetchProposals()
        } catch (err) {
            setTxStatus({ type: 'error', message: err.reason || err.message })
        }
        setExecuting(null)
    }

    const handleCreateElection = async () => {
        if (!electionTitle.trim()) {
            setTxStatus({ type: 'error', message: 'please enter an election title' })
            return
        }
        setIsCreating(true)
        setTxStatus({ type: '', message: '' })
        try {
            const tx = await governance.propose(electionTitle.trim(), ethers.ZeroAddress, 0)
            setTxStatus({ type: 'info', message: 'creating election...' })
            const receipt = await tx.wait()
            const event = receipt.logs.find(log => {
                try {
                    return governance.interface.parseLog(log)?.name === 'ProposalCreated'
                } catch { return false }
            })
            const proposalId = event ? governance.interface.parseLog(event).args[0] : 'New'
            setTxStatus({ type: 'success', message: `🎉 election #${proposalId} created successfully!` })
            setElectionTitle('')
            fetchProposals()
        } catch (err) {
            setTxStatus({ type: 'error', message: err.reason || err.message })
        }
        setIsCreating(false)
    }

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600)
        const days = Math.floor(hours / 24)
        if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
        return `${hours} hour${hours > 1 ? 's' : ''}`
    }

    const getEstimatedEndTime = () => {
        if (!votingDuration) return 'loading...'
        const endTime = new Date(Date.now() + votingDuration * 1000)
        return endTime.toLocaleString()
    }

    const formatEth = (wei) => {
        try { return ethers.formatEther(wei) } catch { return '0' }
    }

    if (!account) {
        return (
            <div className="page-wrapper">
                <StarField />
                <div className="page-content">
                    <SectionParticles variant="mixed" density={50} />
                    <div className="page-header">
                        <Link to="/" className="page-back">← back to home</Link>
                        <h1 className="typo-h1" style={{ color: '#F6FF0D' }}>admin panel</h1>
                        <p className="page-subtitle">connect the owner wallet to manage proposals</p>
                    </div>
                    <div className="page-grid" style={{ justifyContent: 'center' }}>
                        <div className="page-card" style={{ textAlign: 'center', maxWidth: '500px' }}>
                            <div className="page-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#F6FF0D" strokeWidth="1.5">
                                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="typo-h4">admin access required</h3>
                            <p>connect the owner wallet to manage governance proposals and voter registry.</p>
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
                <SectionParticles variant="mixed" density={50} />
                <div className="page-header">
                    <Link to="/" className="page-back">← back to home</Link>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
                        <div>
                            <h1 className="typo-h1" style={{ color: '#F6FF0D' }}>election command center</h1>
                            <p className="page-subtitle">create elections, manage proposals, and monitor voter registry</p>
                        </div>
                        <button className="btn btn--important" onClick={() => navigate('/register-employee')}>
                            <span className="btn-inner"><span>➕ register employee</span></span>
                        </button>
                    </div>
                </div>

                {/* Election Creation & System Config */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    {/* Launch New Election */}
                    <div className="page-card">
                        <h2 className="typo-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🚀</span> launch new election
                        </h2>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '13px', opacity: 0.6, display: 'block', marginBottom: '8px' }}>
                                election title / proposal description
                            </label>
                            <textarea
                                value={electionTitle}
                                onChange={(e) => setElectionTitle(e.target.value)}
                                placeholder="e.g., should we implement a new employee benefit program?"
                                rows={3}
                                className="page-textarea"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.3)', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', opacity: 0.7 }}>⏱️ timing preview</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                                <span style={{ opacity: 0.6 }}>start time:</span>
                                <span style={{ color: '#4ade80', fontFamily: 'monospace' }}>now</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                                <span style={{ opacity: 0.6 }}>end time:</span>
                                <span style={{ color: '#06b6d4', fontFamily: 'monospace', fontSize: '11px' }}>{getEstimatedEndTime()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <span style={{ opacity: 0.6 }}>duration:</span>
                                <span style={{ color: '#F6FF0D', fontWeight: 'bold' }}>{formatDuration(votingDuration)}</span>
                            </div>
                        </div>
                        <button className="btn btn--important" onClick={handleCreateElection} disabled={isCreating || !electionTitle.trim()} style={{ width: '100%' }}>
                            <span className="btn-inner">
                                <span>{isCreating ? '⏳ creating...' : '🚀 launch election'}</span>
                            </span>
                        </button>
                    </div>

                    {/* System Configuration */}
                    <div className="page-card">
                        <h2 className="typo-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>⚙️</span> system configuration
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', opacity: 0.6 }}>voting period</span>
                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>active</span>
                                </div>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#818cf8', marginBottom: '4px' }}>
                                    {formatDuration(systemConfig.votingPeriod)}
                                </p>
                                <p style={{ fontSize: '11px', opacity: 0.4 }}>{systemConfig.votingPeriod.toLocaleString()} seconds</p>
                            </div>
                            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', opacity: 0.6 }}>quorum required</span>
                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#4ade80' }}>fixed</span>
                                </div>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80', marginBottom: '4px' }}>{systemConfig.quorum}</p>
                                <p style={{ fontSize: '11px', opacity: 0.4 }}>minimum participation threshold</p>
                            </div>
                            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(246, 255, 13, 0.1)', border: '1px solid rgba(246, 255, 13, 0.3)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', opacity: 0.6 }}>admin wallet</span>
                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(246, 255, 13, 0.2)', color: '#F6FF0D' }}>connected</span>
                                </div>
                                <p style={{ fontSize: '13px', fontFamily: 'monospace', color: '#F6FF0D', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                                    {systemConfig.adminWallet || 'loading...'}
                                </p>
                                <p style={{ fontSize: '11px', opacity: 0.4 }}>authorized governance controller</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Message */}
                {txStatus.message && (
                    <div className={`page-status-message ${txStatus.type}`} style={{ marginBottom: '32px' }}>
                        {txStatus.message}
                    </div>
                )}

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    {[
                        { label: 'total', value: proposals.length, color: '#818cf8' },
                        { label: 'active', value: proposals.filter((p) => p.state === 'Active').length, color: '#06b6d4' },
                        { label: 'succeeded', value: proposals.filter((p) => p.state === 'Succeeded').length, color: '#4ade80' },
                        { label: 'executed', value: proposals.filter((p) => p.state === 'Executed').length, color: '#F6FF0D' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="page-card" style={{ textAlign: 'center', padding: '20px' }}>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', color, marginBottom: '4px' }}>{value}</p>
                            <p style={{ fontSize: '12px', opacity: 0.5, textTransform: 'lowercase' }}>{label}</p>
                        </div>
                    ))}
                </div>

                {/* Proposals Table */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div className="page-spinner" style={{ margin: '0 auto 16px' }}></div>
                        <p style={{ opacity: 0.5 }}>loading proposals...</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                        {proposals.map((p) => (
                            <div key={p.id} className="page-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.5 }}>#{p.id}</span>
                                            <span className={`page-proposal-status ${p.state.toLowerCase()}`}>{p.state}</span>
                                        </div>
                                        <p style={{ fontSize: '15px', marginBottom: '8px', lineHeight: 1.4 }}>{p.description}</p>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', opacity: 0.5 }}>
                                            <span>for: {formatEth(p.forVotes)}</span>
                                            <span>against: {formatEth(p.againstVotes)}</span>
                                            {p.amount > 0 && <span>💰 {formatEth(p.amount)} ETH</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                        {p.state === 'Succeeded' && (
                                            <button className="btn btn--important" onClick={() => handleExecute(p.id)} disabled={executing === p.id}>
                                                <span className="btn-inner"><span>{executing === p.id ? 'executing...' : '⚡ execute'}</span></span>
                                            </button>
                                        )}
                                        {!p.executed && !p.cancelled && (
                                            <button className="btn" onClick={() => handleCancel(p.id)} disabled={executing === p.id} style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                                                <span className="btn-inner"><span>cancel</span></span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Voter Analytics */}
                {voterStats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        {/* Voter Verification Chart */}
                        <div className="page-card">
                            <h2 className="typo-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>📊</span> voter verification status
                            </h2>
                            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Doughnut
                                    data={{
                                        labels: ['verified voters', 'unverified'],
                                        datasets: [{
                                            data: [voterStats.verifiedCount, voterStats.unverifiedCount],
                                            backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(100, 116, 139, 0.5)'],
                                            borderColor: ['rgba(16, 185, 129, 1)', 'rgba(100, 116, 139, 0.8)'],
                                            borderWidth: 2,
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                                labels: { color: '#cbd5e1', padding: 15, font: { size: 12 } }
                                            },
                                            tooltip: {
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                titleColor: '#fff',
                                                bodyColor: '#cbd5e1',
                                                borderColor: 'rgba(99, 102, 241, 0.5)',
                                                borderWidth: 1,
                                                padding: 12,
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#4ade80' }}>{voterStats.verificationRate}%</p>
                                <p style={{ fontSize: '12px', opacity: 0.5 }}>verification rate</p>
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="page-card">
                            <h2 className="typo-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>📈</span> registry statistics
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.3)' }}>
                                    <div>
                                        <p style={{ fontSize: '13px', opacity: 0.6, marginBottom: '4px' }}>total employees</p>
                                        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{voterStats.totalEmployees}</p>
                                    </div>
                                    <div style={{ fontSize: '40px' }}>👥</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                    <div>
                                        <p style={{ fontSize: '13px', color: '#4ade80', marginBottom: '4px' }}>verified voters</p>
                                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80' }}>{voterStats.verifiedCount}</p>
                                    </div>
                                    <div style={{ fontSize: '40px' }}>✅</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '8px', background: 'rgba(100, 116, 139, 0.2)' }}>
                                    <div>
                                        <p style={{ fontSize: '13px', opacity: 0.6, marginBottom: '4px' }}>pending verification</p>
                                        <p style={{ fontSize: '24px', fontWeight: 'bold', opacity: 0.8 }}>{voterStats.unverifiedCount}</p>
                                    </div>
                                    <div style={{ fontSize: '40px' }}>⏳</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
