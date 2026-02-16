import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedHeadline from './AnimatedHeadline';

export default function Hero() {
    const navigate = useNavigate();

    return (
        <section className="hero" id="hero">
            <div className="hero-container" style={{ zIndex: 10, position: 'relative', pointerEvents: 'auto' }}>
                <h1 className="hero-title" style={{
                    color: '#F6FF0D',
                    fontFamily: "'OTJubilee Diamond', sans-serif",
                    fontSize: 'clamp(80px, 18vw, 240px)',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    lineHeight: 0.9,
                    textTransform: 'uppercase',
                    marginBottom: '32px'
                }}>
                    KWOTE
                </h1>
                <p className="hero-subtitle" style={{ color: '#F6FF0D', fontSize: '1.2em', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.8 }}>
                    secure corporate voting platform
                </p>
                <p className="hero-text">
                    a decentralized application for transparent, tamper-proof, and highly secure internal elections.
                    blockchain meets biometric authentication — every vote verified, every result immutable.
                </p>
                <div className="hero-cta">
                    <button
                        className="btn btn--important"
                        type="button"
                        onClick={() => {
                            console.log("Navigating to login...");
                            navigate('/login');
                        }}
                    >
                        <span className="btn-inner">
                            <span className="btn-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            <span>cast your vote</span>
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
                    </button>
                </div>
            </div>

            {/* Ticker / marquee */}
            <div className="ticker">
                <div className="ticker-inner">
                    <div className="ticker-stripe">
                        <img src="/assets/images/icon-stripes.svg" alt="" />
                    </div>
                    <div className="ticker-link">
                        <a href="#features-section">
                            <div className="ticker-content">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="ticker-item">
                                        <span className="ticker-icon-rotate">◆</span>
                                        <span>blockchain-powered voting — transparent, secure, immutable</span>
                                    </div>
                                ))}
                            </div>
                        </a>
                    </div>
                    <div className="ticker-stripe">
                        <img src="/assets/images/icon-stripes.svg" alt="" />
                    </div>
                </div>
            </div>
        </section>
    )
}
