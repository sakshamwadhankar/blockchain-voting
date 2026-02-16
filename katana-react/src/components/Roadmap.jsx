import AnimatedHeadline from './AnimatedHeadline'
import FadeIn from './FadeIn'
import SectionParticles from './SectionParticles'

const phases = [
    {
        icon: '/assets/images/icon-testnet-green.svg',
        title: 'phase 1: foundation',
        text: 'smart contract development with solidity 0.8.24 and openzeppelin. hardhat setup for multi-chain deployment, testing, and gas optimization. core KWOTE logic and ERC20 voting token implementation.',
        timeline: 'complete',
    },
    {
        icon: '/assets/images/icon-mainnet-green.svg',
        title: 'phase 2: identity & pwa',
        text: 'three-layer biometric verification — corporate email OTP, face recognition with liveness detection, and WebAuthn device biometrics. PWABuilder integration for installable cross-platform experience.',
        timeline: 'in progress',
    },
    {
        icon: '/assets/images/icon-beyond-green.svg',
        title: 'phase 3: launch & scale',
        text: 'live results panel with socket.io streaming, admin dashboard for proposal management, enterprise pilot deployments, and cross-chain KWOTE expansion for multi-entity corporate structures.',
        timeline: 'upcoming',
    },
]

export default function Roadmap() {
    return (
        <section className="roadmap" id="roadmap-section">
            <SectionParticles variant="blue" density={30} />
            <div className="roadmap-container">
                <div className="roadmap-header">
                    <AnimatedHeadline
                        text="development roadmap."
                        tag="h2"
                        className="typo-h2"
                    />
                </div>

                <div className="roadmap-grid">
                    {phases.map((phase, i) => (
                        <FadeIn key={i} delay={i * 200}>
                            <div className="roadmap-item">
                                <div className="roadmap-item-icon">
                                    <img src={phase.icon} alt={phase.title} />
                                </div>
                                <h3 className="roadmap-item-title typo-h4">{phase.title}</h3>
                                <p className="roadmap-item-text">{phase.text}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                <div className="roadmap-timeline">
                    {phases.map((phase, i) => (
                        <div key={i} className="roadmap-timeline-label">
                            {phase.timeline}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
