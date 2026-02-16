import AnimatedHeadline from './AnimatedHeadline'
import FadeIn from './FadeIn'
import SectionParticles from './SectionParticles'

export default function Liquidity() {
    return (
        <section className="liquidity" id="liquidity-section">
            <SectionParticles variant="blue" density={35} />
            <div className="section-container">
                <div className="liquidity-header">
                    <AnimatedHeadline
                        text="why blockchain voting?"
                        text2="trust through transparency."
                        tag="h2"
                        className="typo-h2"
                    />
                </div>
                <FadeIn>
                    <div className="liquidity-content">
                        <h5>
                            traditional corporate elections suffer from opacity, manual counting errors,
                            and lack of verifiability. kwote eliminates these risks with an immutable
                            on-chain KWOTE system.
                        </h5>
                        <ul>
                            <li>
                                every vote is cryptographically sealed on the blockchain — no tampering,
                                no manipulation, full auditability
                            </li>
                            <li>
                                multi-factor biometric authentication ensures only verified employees can participate
                            </li>
                            <li>
                                real-time results streaming provides instant transparency for all stakeholders
                            </li>
                        </ul>
                        <p>
                            <strong>learn more about kwote's architecture →</strong>
                        </p>
                    </div>
                </FadeIn>
            </div>
        </section>
    )
}
