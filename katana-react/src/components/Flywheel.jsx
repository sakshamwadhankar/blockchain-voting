import { useState } from 'react'
import AnimatedHeadline from './AnimatedHeadline'
import FadeIn from './FadeIn'
import SectionParticles from './SectionParticles'

const items = [
    {
        title: 'secure login',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
        ),
        text: 'employees authenticate using corporate credentials and connect a digital wallet uniquely linked to their corporate identity.',
    },
    {
        title: 'biometric verification',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 1a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <circle cx="12" cy="12" r="10" />
            </svg>
        ),
        text: 'face recognition with liveness detection and device biometrics via WebAuthn — three-layer identity verification prevents fraud and sybil attacks.',
    },
    {
        title: 'cast your ballot',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12l2 2 4-4" />
                <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
        ),
        text: 'browse active proposals — board elections, policy changes, budget approvals — and vote directly from any device through the progressive web app.',
    },
    {
        title: 'on-chain recording',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
        ),
        text: 'every vote is sealed as an immutable transaction on the blockchain. the KWOTE smart contract enforces quorum rules and tallies automatically.',
    },
    {
        title: 'instant results',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
        text: 'receive a cryptographic receipt instantly. the live results panel streams real-time voting progress via socket.io with full anonymity preserved.',
    },
]

export default function Flywheel() {
    const [activeIndex, setActiveIndex] = useState(0)

    return (
        <section className="flywheel" id="flywheel-section">
            <SectionParticles variant="yellow" density={30} />
            <div className="section-container">
                <div className="flywheel-header">
                    <AnimatedHeadline
                        text="how voting works."
                        tag="h2"
                        className="typo-h2"
                    />
                    <FadeIn delay={200}>
                        <p className="typo-p" style={{ maxWidth: 560, marginTop: 16 }}>
                            from authentication to immutable results — a seamless, five-step
                            process designed for security and transparency.
                        </p>
                    </FadeIn>
                </div>

                <FadeIn delay={400}>
                    <div className="flywheel-items">
                        {items.map((item, i) => (
                            <div
                                key={i}
                                className={`flywheel-item ${activeIndex === i ? 'active' : ''}`}
                                onClick={() => setActiveIndex(i)}
                            >
                                <div className="flywheel-item-title">
                                    <span className="flywheel-item-icon">{item.icon}</span>
                                    <span className="typo-h4">{item.title}</span>
                                </div>
                                <div className="flywheel-item-text">
                                    <p>{item.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </FadeIn>
            </div>
        </section>
    )
}
