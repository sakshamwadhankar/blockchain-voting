export default function Footer() {
    return (
        <footer className="footer" id="footer">
            <div className="footer-inner">
                <div className="footer-left">
                    <div className="footer-icons">
                        {/* Kwote logo */}
                        <svg fill="none" height="42" viewBox="0 0 36 42" width="36" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.8015 14.6354V0H6.34352L0 20.9476H5.07482L0 37.7058H14.8015V27.2688L27.4891 42L36 29.3266L19.0841 20.9476H14.8015H25.3739L31.7172 0H23.2593L14.8015 14.6354Z" fill="#F6FF0D" />
                        </svg>
                    </div>
                    <div className="footer-foundation">
                        <span>powered by</span>
                        <span style={{ color: '#F6FF0D', fontWeight: 'bold' }}>ethereum</span>
                        <span>&</span>
                        <span style={{ color: '#F6FF0D', fontWeight: 'bold' }}>openzeppelin</span>
                    </div>
                </div>

                <div className="footer-gradient-bar">
                    <svg viewBox="0 0 24 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="footer-gradient" x1="12" y1="0" x2="12" y2="200" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#F6FF0D" />
                                <stop offset="0.5" stopColor="#419DE7" />
                                <stop offset="1" stopColor="#1443AC" />
                            </linearGradient>
                        </defs>
                        <rect width="4" height="200" x="10" rx="2" fill="url(#footer-gradient)" />
                    </svg>
                </div>

                <div className="footer-legal">
                    <div className="footer-legal-links">
                        <a href="#features-section">documentation</a>
                        <a href="#">terms of service</a>
                        <a href="#">privacy policy</a>
                    </div>
                    <p style={{ fontSize: 11, opacity: 0.3 }}>
                        © 2026 kwote. secure corporate voting platform.
                    </p>
                </div>
            </div>
        </footer>
    )
}
