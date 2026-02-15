import { useState, useRef, useEffect } from 'react'
import AnimatedHeadline from './AnimatedHeadline'
import FadeIn from './FadeIn'
import SectionParticles from './SectionParticles'

const FeatureIcon = ({ type }) => {
    const icons = {
        governance: (
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="30" cy="30" r="25" stroke="#F6FF0D" strokeWidth="2" fill="none" />
                <circle cx="30" cy="30" r="15" fill="#F6FF0D" />
                <circle cx="30" cy="30" r="8" fill="#000" />
            </svg>
        ),
        pwa: (
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="10" width="40" height="40" stroke="#00FF94" strokeWidth="2" fill="none" />
                <rect x="20" y="20" width="20" height="20" fill="#00FF94" />
            </svg>
        ),
        identity: (
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 5L50 20L50 40L30 55L10 40L10 20L30 5Z" stroke="#FF006B" strokeWidth="2" fill="none" />
                <path d="M30 15L40 25L40 35L30 45L20 35L20 25L30 15Z" fill="#FF006B" />
            </svg>
        ),
        analytics: (
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 50L20 30L30 40L40 20L50 35" stroke="#F6FF0D" strokeWidth="3" fill="none" />
                <circle cx="20" cy="30" r="4" fill="#F6FF0D" />
                <circle cx="30" cy="40" r="4" fill="#F6FF0D" />
                <circle cx="40" cy="20" r="4" fill="#F6FF0D" />
            </svg>
        ),
        admin: (
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="15" y="15" width="30" height="30" stroke="#00FF94" strokeWidth="2" fill="none" />
                <line x1="15" y1="25" x2="45" y2="25" stroke="#00FF94" strokeWidth="2" />
                <line x1="15" y1="35" x2="45" y2="35" stroke="#00FF94" strokeWidth="2" />
                <line x1="25" y1="15" x2="25" y2="45" stroke="#00FF94" strokeWidth="2" />
                <line x1="35" y1="15" x2="35" y2="45" stroke="#00FF94" strokeWidth="2" />
            </svg>
        ),
    }
    return icons[type] || icons.governance
}

const features = [
    {
        id: 'governance',
        title: 'governance smart contract',
        description:
            'the central engine of kwote — a solidity 0.8.24 smart contract using openzeppelin standards for ERC20 voting power and governance logic. manages proposal creation, voting periods, quorum enforcement, and automated tallying.',
    },
    {
        id: 'pwa',
        title: 'progressive web app',
        description:
            'built with PWABuilder for a native-app experience on android and desktop. employees can browse active proposals, cast votes, and track results — all without an app store download.',
    },
    {
        id: 'identity',
        title: 'identity & biometrics',
        description:
            'three-step verification: corporate email OTP, face recognition with liveness detection, and device biometrics via WebAuthn. prevents fraud and sybil attacks while keeping sensitive data on-device.',
    },
    {
        id: 'analytics',
        title: 'real-time analytics',
        description:
            'a live results panel powered by socket.io and ethers.js that streams voting progress in real-time. privacy filters mask voter addresses while providing an immediate, transparent audit trail.',
    },
    {
        id: 'admin',
        title: 'admin dashboard',
        description:
            'administrators define election parameters — descriptions, quorum requirements, start/end timestamps. manage authorized voter lists and monitor turnout trends without compromising individual anonymity.',
    },
]

export default function Features() {
    const [activeFeature, setActiveFeature] = useState(0)
    const current = features[activeFeature]

    return (
        <section className="features" id="features-section">
            <SectionParticles variant="mixed" density={45} />
            <div className="features-container">
                <div className="features-header">
                    <AnimatedHeadline
                        text="core components."
                        tag="h2"
                        className="typo-h2"
                    />
                </div>

                <FadeIn delay={300}>
                    <div className="features-grid">
                        <div className="features-tabs">
                            {features.map((f, i) => (
                                <button
                                    key={f.id}
                                    className={`feature-tab ${activeFeature === i ? 'active' : ''}`}
                                    onClick={() => setActiveFeature(i)}
                                >
                                    <span className="feature-tab-icon">
                                        <FeatureIcon type={f.id} />
                                    </span>
                                    <span>{f.title}</span>
                                </button>
                            ))}
                        </div>

                        <div className="feature-display">
                            <div className="feature-display-text" style={{ padding: '40px' }}>
                                <h3 className="typo-h3" style={{ marginBottom: '16px', color: '#F6FF0D' }}>
                                    {current.title}
                                </h3>
                                <p style={{ lineHeight: 1.8, fontSize: '15px' }}>{current.description}</p>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    )
}
