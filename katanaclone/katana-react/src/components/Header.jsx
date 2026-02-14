import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'

export default function Header() {
    const { account, connect, disconnect } = useWallet()

    return (
        <header className="header" id="header">
            <Link to="/" className="header-logo">
                {/* Kwote K logo (yellow filled) */}
                <svg className="header-logo-k" fill="none" height="42" viewBox="0 0 36 42" width="36" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.8015 14.6354V0H6.34352L0 20.9476H5.07482L0 37.7058H14.8015V27.2688L27.4891 42L36 29.3266L19.0841 20.9476H14.8015H25.3739L31.7172 0H23.2593L14.8015 14.6354Z" fill="#F6FF0D" />
                </svg>
                <span style={{ color: '#F6FF0D', fontSize: '18px', fontWeight: 'bold', marginLeft: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Kwote
                </span>
            </Link>

            <nav className="header-nav">
                <Link to="/verify" className="btn btn--smaller btn--important">
                    <span className="btn-inner">
                        <span className="btn-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </span>
                        <span>verify</span>
                        <span className="corner corner--tl"><svg viewBox="0 0 12 12" fill="none"><path d="M0 12V0H12" stroke="currentColor" strokeWidth="1" /></svg></span>
                        <span className="corner corner--br"><svg viewBox="0 0 12 12" fill="none"><path d="M0 12V0H12" stroke="currentColor" strokeWidth="1" /></svg></span>
                    </span>
                </Link>

                <Link to="/vote" className="btn btn--smaller btn--important">
                    <span className="btn-inner">
                        <span className="btn-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                                <path d="M9 12l2 2 4-4" />
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                            </svg>
                        </span>
                        <span>vote</span>
                        <span className="corner corner--tl"><svg viewBox="0 0 12 12" fill="none"><path d="M0 12V0H12" stroke="currentColor" strokeWidth="1" /></svg></span>
                        <span className="corner corner--br"><svg viewBox="0 0 12 12" fill="none"><path d="M0 12V0H12" stroke="currentColor" strokeWidth="1" /></svg></span>
                    </span>
                </Link>

                <Link to="/results" className="btn btn--smaller btn--important">
                    <span className="btn-inner">
                        <span className="btn-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                        </span>
                        <span>results</span>
                        <span className="corner corner--tl"><svg viewBox="0 0 12 12" fill="none"><path d="M0 12V0H12" stroke="currentColor" strokeWidth="1" /></svg></span>
                        <span className="corner corner--br"><svg viewBox="0 0 12 12" fill="none"><path d="M0 12V0H12" stroke="currentColor" strokeWidth="1" /></svg></span>
                    </span>
                </Link>

                <Link to="/admin" className="btn btn--smaller btn--important">
                    <span className="btn-inner">
                        <span className="btn-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                            </svg>
                        </span>
                        <span>admin</span>
                        <span className="corner corner--tl"><svg viewBox="0 0 12 12" fill="none"><path d="M0 12V0H12" stroke="currentColor" strokeWidth="1" /></svg></span>
                        <span className="corner corner--br"><svg viewBox="0 0 12 12" fill="none"><path d="M0 12V0H12" stroke="currentColor" strokeWidth="1" /></svg></span>
                    </span>
                </Link>

                {/* Wallet Connect Button */}
                {account ? (
                    <button onClick={disconnect} className="wallet-btn wallet-btn--connected" title="Click to disconnect">
                        <span className="wallet-dot"></span>
                        <span>{account.substring(0, 6)}...{account.substring(38)}</span>
                    </button>
                ) : (
                    <button onClick={connect} className="wallet-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                            <path d="M21 12V7H5a2 2 0 010-4h14v4" />
                            <path d="M3 5v14a2 2 0 002 2h16v-5" />
                            <path d="M18 12a2 2 0 100 4 2 2 0 000-4z" />
                        </svg>
                        <span>connect</span>
                    </button>
                )}
            </nav>
        </header>
    )
}
