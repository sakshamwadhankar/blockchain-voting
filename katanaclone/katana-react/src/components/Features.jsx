import { useState, useRef, useEffect } from 'react'
import AnimatedHeadline from './AnimatedHeadline'
import FadeIn from './FadeIn'
import SectionParticles from './SectionParticles'

const features = [
    {
        id: 'governance',
        title: 'governance smart contract',
        icon: '/site_assets/images/storyblok_115x113_icon-vaultbridge.svg',
        description:
            'the central engine of kwote — a solidity 0.8.24 smart contract using openzeppelin standards for ERC20 voting power and governance logic. manages proposal creation, voting periods, quorum enforcement, and automated tallying.',
    },
    {
        id: 'pwa',
        title: 'progressive web app',
        icon: '/site_assets/images/storyblok_172x174_icon-col.svg',
        description:
            'built with PWABuilder for a native-app experience on android and desktop. employees can browse active proposals, cast votes, and track results — all without an app store download.',
    },
    {
        id: 'identity',
        title: 'identity & biometrics',
        icon: '/site_assets/images/storyblok_176x176_icon-core-apps.svg',
        description:
            'three-step verification: corporate email OTP, face recognition with liveness detection, and device biometrics via WebAuthn. prevents fraud and sybil attacks while keeping sensitive data on-device.',
    },
    {
        id: 'analytics',
        title: 'real-time analytics',
        icon: '/site_assets/images/storyblok_168x168_icon-ausd.svg',
        description:
            'a live results panel powered by socket.io and ethers.js that streams voting progress in real-time. privacy filters mask voter addresses while providing an immediate, transparent audit trail.',
    },
    {
        id: 'admin',
        title: 'admin dashboard',
        icon: '/site_assets/images/storyblok_126x126_icon-vbtokens.svg',
        description:
            'administrators define election parameters — descriptions, quorum requirements, start/end timestamps. manage authorized voter lists and monitor turnout trends without compromising individual anonymity.',
    },
]

export default function Features() {
    const [activeFeature, setActiveFeature] = useState(0)
    const current = features[activeFeature]

    return (
        <section className="section features" id="features-section">
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
                                        <img src={f.icon} alt={f.title} />
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
