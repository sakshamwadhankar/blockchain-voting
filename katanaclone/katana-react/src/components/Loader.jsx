import { useEffect, useState } from 'react'

function CurtainPlane({ fill, delay, rotated, open }) {
    return (
        <svg
            className={`curtain-plane ${rotated ? 'curtain-plane--rotated' : ''} ${open ? 'curtain-plane--open' : ''}`}
            fill={fill}
            preserveAspectRatio="none"
            style={{ transitionDelay: `${delay}s` }}
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="curtain-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="3%" stopColor="#1f273c" />
                    <stop offset="46%" stopColor="#4887c7" />
                    <stop offset="72%" stopColor="#c9c5e6" />
                    <stop offset="85%" stopColor="#f9a67b" />
                    <stop offset="100%" stopColor="#f62604" />
                </linearGradient>
                <linearGradient id="curtain-gradient-rot" gradientTransform="rotate(180, 0.5, 0.5)" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="3%" stopColor="#1f273c" />
                    <stop offset="46%" stopColor="#4887c7" />
                    <stop offset="72%" stopColor="#c9c5e6" />
                    <stop offset="85%" stopColor="#f9a67b" />
                    <stop offset="100%" stopColor="#f62604" />
                </linearGradient>
            </defs>
            <g>
                <path d="M 0 0 L 80 0 L 88 50 L 92 50 L 100 100 L 0 100 L 0 0" />
            </g>
        </svg>
    )
}

export default function Loader({ visible }) {
    const [opening, setOpening] = useState(false)

    useEffect(() => {
        if (!visible) {
            // Start curtain open animation
            const timer = setTimeout(() => setOpening(true), 100)
            return () => clearTimeout(timer)
        }
    }, [visible])

    return (
        <>
            {/* Loading screen with logo */}
            <div className={`loader-visual ${!visible ? 'loader-visual--done' : ''}`}>
                <CurtainPlane fill="#419de7" delay={0.5} rotated />
                <CurtainPlane fill="#419de7" delay={0.5} />
                <CurtainPlane fill="#1443ac" delay={0.3} rotated />
                <CurtainPlane fill="#1443ac" delay={0.3} />
                <CurtainPlane fill="url(#curtain-gradient)" delay={0.1} rotated />
                <CurtainPlane fill="url(#curtain-gradient-rot)" delay={0.1} />

                <div className="loader-logo">
                    <div className="loader-logo-inner">
                        <svg fill="none" height="42" viewBox="0 0 36 42" width="36" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.8015 14.6354V0H6.34352L0 20.9476H5.07482L0 37.7058H14.8015V27.2688L27.4891 42L36 29.3266L19.0841 20.9476H14.8015H25.3739L31.7172 0H23.2593L14.8015 14.6354Z" fill="#F6FF0D" />
                        </svg>
                    </div>
                    <div className="loader-logo-outline" data-index="1">
                        <svg fill="none" viewBox="0 0 183 215" xmlns="http://www.w3.org/2000/svg">
                            <path d="M75.0256 0.632233V76.5834L75.9592 74.9516L118.507 0.632233H160.239L128.519 106.366H97.1428L96.9192 107.313L181.799 149.752L139.519 213.303L75.9065 138.748L75.0256 137.717V191.752H1.48462L26.9075 107.009L27.1008 106.366H1.48462L33.2043 0.632233H75.0256Z" stroke="#F6FF0D" />
                        </svg>
                    </div>
                    <div className="loader-logo-outline" data-index="2">
                        <svg fill="none" viewBox="0 0 183 215" xmlns="http://www.w3.org/2000/svg">
                            <path d="M75.0256 0.632233V76.5834L75.9592 74.9516L118.507 0.632233H160.239L128.519 106.366H97.1428L96.9192 107.313L181.799 149.752L139.519 213.303L75.9065 138.748L75.0256 137.717V191.752H1.48462L26.9075 107.009L27.1008 106.366H1.48462L33.2043 0.632233H75.0256Z" stroke="#F6FF0D" />
                        </svg>
                    </div>
                    <div className="loader-logo-outline" data-index="3">
                        <svg fill="none" viewBox="0 0 183 215" xmlns="http://www.w3.org/2000/svg">
                            <path d="M75.0256 0.632233V76.5834L75.9592 74.9516L118.507 0.632233H160.239L128.519 106.366H97.1428L96.9192 107.313L181.799 149.752L139.519 213.303L75.9065 138.748L75.0256 137.717V191.752H1.48462L26.9075 107.009L27.1008 106.366H1.48462L33.2043 0.632233H75.0256Z" stroke="#F6FF0D" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Curtain that opens */}
            <div className={`curtain ${opening ? 'curtain--open' : ''}`}>
                <CurtainPlane fill="#419de7" delay={0} rotated open={opening} />
                <CurtainPlane fill="#419de7" delay={0.5} open={opening} />
                <CurtainPlane fill="#1443ac" delay={0.3} rotated open={opening} />
                <CurtainPlane fill="#1443ac" delay={0.3} open={opening} />
                <CurtainPlane fill="#11162f" delay={0.1} rotated open={opening} />
                <CurtainPlane fill="#11162f" delay={0.1} open={opening} />

                <div className={`curtain-logo ${opening ? 'curtain-logo--hidden' : ''}`}>
                    <svg fill="none" height="42" viewBox="0 0 36 42" width="36" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.8015 14.6354V0H6.34352L0 20.9476H5.07482L0 37.7058H14.8015V27.2688L27.4891 42L36 29.3266L19.0841 20.9476H14.8015H25.3739L31.7172 0H23.2593L14.8015 14.6354Z" fill="#F6FF0D" />
                    </svg>
                    <svg className="curtain-logo-outline" fill="none" viewBox="0 0 183 215" xmlns="http://www.w3.org/2000/svg">
                        <path d="M75.0256 0.632233V76.5834L75.9592 74.9516L118.507 0.632233H160.239L128.519 106.366H97.1428L96.9192 107.313L181.799 149.752L139.519 213.303L75.9065 138.748L75.0256 137.717V191.752H1.48462L26.9075 107.009L27.1008 106.366H1.48462L33.2043 0.632233H75.0256Z" stroke="#F6FF0D" />
                    </svg>
                </div>
            </div>
        </>
    )
}
