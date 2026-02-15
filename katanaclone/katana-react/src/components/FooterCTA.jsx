import AnimatedHeadline from './AnimatedHeadline'
import FadeIn from './FadeIn'
import SectionParticles from './SectionParticles'

export default function FooterCTA() {
    return (
        <section className="footer-cta" id="footer-cta-section">
            <SectionParticles variant="mixed" density={50} />
            <div className="section-container">
                <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
                    <FadeIn>
                        <p className="typo-h3" style={{ marginBottom: 24 }}>ready to transform corporate governance?</p>
                        <AnimatedHeadline
                            text="deploy kwote today."
                            tag="h2"
                            className="typo-h1"
                        />
                    </FadeIn>
                </div>

                <FadeIn delay={300}>
                    <div className="footer-cta-buttons">
                        <a
                            className="btn btn--important"
                            href="#newsletter-section"
                        >
                            <span className="btn-inner">
                                <span className="btn-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </span>
                                <span>get started</span>
                                <span className="corner corner--tl">
                                    <svg viewBox="0 0 12 12" fill="none">
                                        <path d="M0 12V0H12" stroke="currentColor" strokeWidth="1" />
                                    </svg>
                                </span>
                                <span className="corner corner--br">
                                    <svg viewBox="0 0 12 12" fill="none">
                                        <path d="M0 12V0H12" stroke="currentColor" strokeWidth="1" />
                                    </svg>
                                </span>
                            </span>
                        </a>

                        <a
                            className="btn"
                            href="#features-section"
                        >
                            <span className="btn-inner">
                                <span className="btn-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </span>
                                <span>read the docs</span>
                                <span className="corner corner--tl">
                                    <svg viewBox="0 0 12 12" fill="none">
                                        <path d="M0 12V0H12" stroke="currentColor" strokeWidth="1" />
                                    </svg>
                                </span>
                                <span className="corner corner--br">
                                    <svg viewBox="0 0 12 12" fill="none">
                                        <path d="M0 12V0H12" stroke="currentColor" strokeWidth="1" />
                                    </svg>
                                </span>
                            </span>
                        </a>
                    </div>
                </FadeIn>
            </div>
        </section>
    )
}
