import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ethers } from 'ethers'
import { useWallet } from '../context/WalletContext'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import SectionParticles from '../components/SectionParticles'
import StarField from '../components/StarField'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function ResultsPage() {
    const { governance } = useWallet()
    const [loading, setLoading] = useState(true)
    const [proposalId, setProposalId] = useState(null)
    const [results, setResults] = useState({ for: 0, against: 0 })
    const [auditLog, setAuditLog] = useState([])
    const [proposal, setProposal] = useState(null)

    useEffect(() => {
        if (!governance) return
        let isMounted = true

        const fetchData = async () => {
            try {
                const nextId = await governance.nextProposalId()
                const currentId = Number(nextId) - 1
                if (currentId < 0) {
                    setLoading(false)
                    return
                }
                setProposalId(currentId)

                const p = await governance.getProposal(currentId)
                setProposal(p)
                setResults({
                    for: Number(p.forVotes),
                    against: Number(p.againstVotes),
                })

                const filter = governance.filters.Voted(currentId)
                const events = await governance.queryFilter(filter)
                const formattedLog = await Promise.all(
                    events.map(async (e) => {
                        const block = await e.getBlock()
                        return {
                            txHash: e.transactionHash,
                            voter: e.args[1],
                            support: e.args[2],
                            weight: e.args[3].toString(),
                            timestamp: new Date(block.timestamp * 1000).toLocaleTimeString(),
                        }
                    })
                )
                if (isMounted) {
                    setAuditLog(formattedLog.reverse())
                    setLoading(false)
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', err)
                setLoading(false)
            }
        }

        fetchData()

        const handleNewVote = async (id, voter, support, weight, event) => {
            const votedId = Number(id)
            if (proposalId !== null && votedId !== proposalId) return
            setResults((prev) => ({
                for: support ? prev.for + Number(weight) : prev.for,
                against: !support ? prev.against + Number(weight) : prev.against,
            }))
            const block = await event.getBlock()
            const newLogItem = {
                txHash: event.transactionHash,
                voter: voter,
                support: support,
                weight: weight.toString(),
                timestamp: new Date(block.timestamp * 1000).toLocaleTimeString(),
                isNew: true,
            }
            setAuditLog((prev) => [newLogItem, ...prev])
        }

        governance.on('Voted', handleNewVote)

        return () => {
            isMounted = false
            governance.off('Voted', handleNewVote)
        }
    }, [governance, proposalId])

    const chartData = {
        labels: ['votes for', 'votes against'],
        datasets: [
            {
                label: 'votes',
                data: [results.for, results.against],
                backgroundColor: ['rgba(16, 185, 129, 0.6)', 'rgba(239, 68, 68, 0.6)'],
                borderColor: ['rgba(16, 185, 129, 1)', 'rgba(239, 68, 68, 1)'],
                borderWidth: 2,
                borderRadius: 8,
            },
        ],
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: `live results: proposal #${proposalId ?? '-'}`,
                color: '#cbd5e1',
                font: { size: 16, family: "'OTJubilee Diamond', sans-serif" },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#cbd5e1', precision: 0 },
                grid: { color: '#334155' },
            },
            x: {
                ticks: { color: '#cbd5e1' },
                grid: { display: false },
            },
        },
    }

    const formatEth = (wei) => {
        try { return ethers.formatEther(wei) } catch { return '0' }
    }

    if (loading) {
        return (
            <div className="page-wrapper">
                <StarField />
                <div className="page-content">
                    <SectionParticles variant="mixed" density={50} />
                    <div style={{ textAlign: 'center', padding: '120px 0' }}>
                        <div className="page-spinner" style={{ margin: '0 auto 16px' }}></div>
                        <p style={{ opacity: 0.5 }}>loading blockchain data...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (proposalId === null) {
        return (
            <div className="page-wrapper">
                <StarField />
                <div className="page-content">
                    <SectionParticles variant="mixed" density={50} />
                    <div className="page-header">
                        <Link to="/" className="page-back">← back to home</Link>
                        <h1 className="typo-h1" style={{ color: '#F6FF0D' }}>live results</h1>
                        <p className="page-subtitle">real-time election dashboard</p>
                    </div>
                    <div className="page-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🗳️</div>
                        <h3 className="typo-h3" style={{ marginBottom: '8px' }}>waiting for election to start</h3>
                        <p style={{ opacity: 0.6 }}>no proposals found on the blockchain yet</p>
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
                    <h1 className="typo-h1" style={{ color: '#F6FF0D' }}>live results</h1>
                    <p className="page-subtitle">real-time election dashboard with transparent audit trail</p>
                </div>

                {proposal && (
                    <div className="page-card" style={{ marginBottom: '32px' }}>
                        <h3 className="typo-h4" style={{ marginBottom: '12px', color: '#F6FF0D' }}>
                            proposal #{proposalId}
                        </h3>
                        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '16px' }}>
                            {proposal.description}
                        </p>
                        {proposal.amount > 0 && (
                            <p style={{ fontSize: '13px', opacity: 0.6 }}>
                                💰 {formatEth(proposal.amount)} ETH → <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{proposal.recipient?.slice(0, 10)}...</span>
                            </p>
                        )}
                    </div>
                )}

                <div className="page-results-grid">
                    {/* Chart */}
                    <div className="page-result-card">
                        <h2 className="typo-h3" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#4ade80' }}>📊</span> real-time tally
                        </h2>
                        <div style={{ height: '320px' }}>
                            <Bar options={chartOptions} data={chartData} />
                        </div>
                    </div>

                    {/* Audit Log */}
                    <div className="page-result-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
                        <h2 className="typo-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#F6FF0D' }}>📜</span> audit trail
                            <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 'normal', opacity: 0.5, background: 'rgba(246, 255, 13, 0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                                ● live feed
                            </span>
                        </h2>

                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                            {auditLog.length === 0 ? (
                                <p style={{ textAlign: 'center', opacity: 0.4, padding: '40px 0', fontStyle: 'italic' }}>
                                    no votes cast yet. be the first!
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {auditLog.map((log, index) => (
                                        <div
                                            key={`${log.txHash}-${index}`}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: `1px solid ${log.support ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                                background: log.isNew ? (log.support ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)') : 'rgba(0, 0, 0, 0.2)',
                                                display: 'flex',
                                                gap: '12px',
                                                transition: 'all 0.5s ease'
                                            }}
                                        >
                                            <div style={{
                                                width: '4px',
                                                borderRadius: '2px',
                                                background: log.support ? '#4ade80' : '#ef4444'
                                            }}></div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{
                                                        fontSize: '13px',
                                                        fontWeight: 'bold',
                                                        color: log.support ? '#4ade80' : '#ef4444'
                                                    }}>
                                                        {log.support ? 'voted FOR' : 'voted AGAINST'}
                                                    </span>
                                                    <span style={{ fontSize: '11px', opacity: 0.5, fontFamily: 'monospace' }}>
                                                        {log.timestamp}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '11px', opacity: 0.6, fontFamily: 'monospace', marginBottom: '2px' }}>
                                                    wallet: {log.voter.substring(0, 6)}...{log.voter.substring(38)}
                                                </div>
                                                <div style={{ fontSize: '10px', opacity: 0.4, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    tx: {log.txHash}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
