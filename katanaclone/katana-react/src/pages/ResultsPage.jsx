import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ethers } from 'ethers'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { io } from 'socket.io-client'
import { useWallet } from '../context/WalletContext'
import { STATE_LABELS, BACKEND_URL } from '../config/contracts'
import SectionParticles from '../components/SectionParticles'
import StarField from '../components/StarField'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: 'rgba(252,252,252,0.6)', font: { size: 11 } } },
        tooltip: { backgroundColor: 'rgba(17,22,47,0.95)', borderColor: 'rgba(65,157,231,0.3)', borderWidth: 1 },
    },
    scales: {
        x: { ticks: { color: 'rgba(252,252,252,0.5)', font: { size: 10 } }, grid: { color: 'rgba(252,252,252,0.04)' } },
        y: { ticks: { color: 'rgba(252,252,252,0.5)' }, grid: { color: 'rgba(252,252,252,0.06)' } },
    },
}

export default function ResultsPage() {
    const { governance, connect, account } = useWallet()
    const [proposals, setProposals] = useState([])
    const [auditLog, setAuditLog] = useState([])
    const [loading, setLoading] = useState(true)
    const [liveIndicator, setLiveIndicator] = useState(true)

    // Blink live dot
    useEffect(() => {
        const t = setInterval(() => setLiveIndicator((p) => !p), 1000)
        return () => clearInterval(t)
    }, [])

    const formatEth = (wei) => {
        try { return parseFloat(ethers.formatEther(wei)) } catch { return 0 }
    }

    const fetchResults = useCallback(async () => {
        if (!governance) return
        setLoading(true)
        try {
            const count = await governance.nextProposalId()
            const items = []
            for (let i = 0; i < Number(count); i++) {
                const p = await governance.getProposal(i)
                const s = await governance.state(i)
                const forVotes = formatEth(p.forVotes)
                const againstVotes = formatEth(p.againstVotes)
                const total = forVotes + againstVotes
                items.push({
                    id: i,
                    description: p.description,
                    forVotes,
                    againstVotes,
                    total,
                    forPct: total > 0 ? (forVotes / total * 100).toFixed(1) : 0,
                    againstPct: total > 0 ? (againstVotes / total * 100).toFixed(1) : 0,
                    endTime: Number(p.endTime),
                    state: STATE_LABELS[Number(s)] || 'Unknown',
                    stateIndex: Number(s),
                })
            }
            setProposals(items.reverse())
        } catch (err) {
            console.error('Fetch results:', err)
        }
        setLoading(false)
    }, [governance])

    useEffect(() => { fetchResults() }, [fetchResults])

    // Listen for live vote events from Socket.IO
    useEffect(() => {
        const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] })
        socket.on('newVote', (data) => {
            setAuditLog((prev) => [
                {
                    id: Date.now(),
                    time: new Date().toLocaleTimeString(),
                    proposalId: data.proposalId,
                    voter: data.voter,
                    support: data.support,
                    weight: data.weight,
                    txHash: data.txHash,
                },
                ...prev,
            ].slice(0, 50))
            // Refresh data on new vote
            fetchResults()
        })
        return () => socket.disconnect()
    }, [fetchResults])

    // Also listen to on-chain events directly
    useEffect(() => {
        if (!governance) return
        const handleVoted = (id, voter, support, weight) => {
            setAuditLog((prev) => [
                {
                    id: Date.now(),
                    time: new Date().toLocaleTimeString(),
                    proposalId: Number(id),
                    voter,
                    support,
                    weight: formatEth(weight),
                    txHash: '',
                },
                ...prev,
            ].slice(0, 50))
        }
        governance.on('Voted', handleVoted)
        return () => { governance.off('Voted', handleVoted) }
    }, [governance])

    const chartData = {
        labels: proposals.slice(0, 8).map((p) => `#${p.id}`),
        datasets: [
            {
                label: 'For',
                data: proposals.slice(0, 8).map((p) => p.forVotes),
                backgroundColor: 'rgba(74, 222, 128, 0.7)',
                borderRadius: 4,
            },
            {
                label: 'Against',
                data: proposals.slice(0, 8).map((p) => p.againstVotes),
                backgroundColor: 'rgba(248, 113, 113, 0.7)',
                borderRadius: 4,
            },
        ],
    }

    // No wallet
    if (!account) {
        return (
            <div className="page-wrapper">
                <StarField />
                <div className="page-content">
                    <SectionParticles variant="purple" density={40} />
                    <div className="page-header">
                        <Link to="/" className="page-back">← back to home</Link>
                        <h1 className="typo-h1" style={{ color: '#F6FF0D' }}>connect wallet</h1>
                        <p className="page-subtitle">connect your wallet to view live voting results</p>
                    </div>
                    <div className="page-grid" style={{ justifyContent: 'center' }}>
                        <div className="page-card" style={{ textAlign: 'center', maxWidth: '500px' }}>
                            <div className="page-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#F6FF0D" strokeWidth="1.5">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                            </div>
                            <h3 className="typo-h4">wallet required</h3>
                            <p>connect your MetaMask wallet to access live voting analytics.</p>
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
                <SectionParticles variant="purple" density={40} />
                <div className="page-header">
                    <Link to="/" className="page-back">← back to home</Link>
                    <h1 className="typo-h1" style={{ color: '#F6FF0D' }}>
                        <span className={`live-dot ${liveIndicator ? 'pulse' : ''}`}>●</span> live results
                    </h1>
                    <p className="page-subtitle">real-time voting analytics powered by on-chain data</p>
                    <button className="btn btn--smaller" onClick={fetchResults} disabled={loading} style={{ marginTop: '12px' }}>
                        <span className="btn-inner"><span>{loading ? '⏳' : '↻'} refresh</span></span>
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div className="page-spinner"></div>
                        <p style={{ opacity: 0.5, marginTop: '16px' }}>fetching results from blockchain...</p>
                    </div>
                ) : proposals.length === 0 ? (
                    <div className="page-card" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
                        <p style={{ fontSize: '48px', marginBottom: '12px' }}>📊</p>
                        <h3 className="typo-h4">no proposals found</h3>
                        <p style={{ opacity: 0.6, marginTop: '8px' }}>create a proposal first from the voting page</p>
                    </div>
                ) : (
                    <>
                        {/* Chart Overview */}
                        <div className="page-result-card" style={{ marginBottom: '24px' }}>
                            <h3 className="typo-h4" style={{ marginBottom: '16px' }}>vote distribution overview</h3>
                            <div className="page-chart-container">
                                <Bar data={chartData} options={chartOptions} />
                            </div>
                        </div>

                        {/* Individual Results */}
                        <div className="page-results-grid">
                            {proposals.map((p) => (
                                <div key={p.id} className="page-result-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 className="typo-h4" style={{ flex: 1 }}>
                                            <span style={{ opacity: 0.4, marginRight: '8px' }}>#{p.id}</span>
                                            {p.description}
                                        </h4>
                                        <span style={{
                                            fontSize: '12px', padding: '4px 12px', borderRadius: '999px',
                                            background: p.state === 'Active' ? 'rgba(34,211,238,0.15)' : 'rgba(252,252,252,0.06)',
                                            color: p.state === 'Active' ? '#22d3ee' : 'rgba(252,252,252,0.5)',
                                            marginLeft: '12px', whiteSpace: 'nowrap'
                                        }}>
                                            {p.state === 'Active' && <span className={`live-dot ${liveIndicator ? 'pulse' : ''}`}>● </span>}
                                            {p.state}
                                        </span>
                                    </div>

                                    <div className="page-result-bars">
                                        <div className="page-result-row">
                                            <span className="page-result-label">for</span>
                                            <div className="page-result-bar-track">
                                                <div className="page-result-bar-fill for" style={{ width: `${p.forPct}%` }}></div>
                                            </div>
                                            <span className="page-result-value">{p.forVotes.toFixed(2)} ({p.forPct}%)</span>
                                        </div>
                                        <div className="page-result-row">
                                            <span className="page-result-label">against</span>
                                            <div className="page-result-bar-track">
                                                <div className="page-result-bar-fill against" style={{ width: `${p.againstPct}%` }}></div>
                                            </div>
                                            <span className="page-result-value">{p.againstVotes.toFixed(2)} ({p.againstPct}%)</span>
                                        </div>
                                    </div>

                                    <div className="page-result-meta">
                                        <span>total votes: {p.total.toFixed(2)}</span>
                                        <span>ends: {new Date(p.endTime * 1000).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Audit Log */}
                        <div className="page-result-card" style={{ marginTop: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 className="typo-h4">
                                    <span className={`live-dot ${liveIndicator ? 'pulse' : ''}`}>●</span> real-time audit trail
                                </h3>
                                <span style={{ fontSize: '12px', opacity: 0.4 }}>{auditLog.length} events</span>
                            </div>

                            {auditLog.length === 0 ? (
                                <p style={{ textAlign: 'center', opacity: 0.4, padding: '24px 0', fontSize: '14px' }}>
                                    waiting for new votes... events will appear here in real-time
                                </p>
                            ) : (
                                <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '13px' }}>
                                    {auditLog.map((log) => (
                                        <div key={log.id} style={{
                                            display: 'flex', gap: '12px', padding: '10px 0', alignItems: 'center',
                                            borderBottom: '1px solid rgba(252,252,252,0.04)',
                                        }}>
                                            <span style={{ opacity: 0.4, minWidth: '70px' }}>{log.time}</span>
                                            <span style={{ color: log.support ? '#4ade80' : '#f87171' }}>
                                                {log.support ? '✓ FOR' : '✗ AGAINST'}
                                            </span>
                                            <span style={{ opacity: 0.6 }}>proposal #{log.proposalId}</span>
                                            <span style={{ opacity: 0.3, letterSpacing: '0.03em', fontFamily: 'monospace', fontSize: '11px' }}>
                                                {log.voter?.substring(0, 8)}...
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
