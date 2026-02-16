import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const overlayStyles = {
    container: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        borderBottom: '1px solid rgba(246, 255, 13, 0.2)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flexShrink: 0,
    },
    title: {
        color: '#F6FF0D',
        fontFamily: 'monospace',
        fontSize: '14px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        margin: 0,
    },
    dot: {
        width: '8px',
        height: '8px',
        backgroundColor: '#4ade80',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'pulseDot 1.5s ease infinite',
    },
    closeBtn: {
        color: 'rgba(255, 255, 255, 0.7)',
        padding: '8px 20px',
        border: '1px solid rgba(246, 255, 13, 0.3)',
        borderRadius: '6px',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: '13px',
        letterSpacing: '0.05em',
        transition: 'all 0.2s',
    },
    iframeContainer: {
        flex: 1,
        width: '100%',
        position: 'relative',
    },
    iframe: {
        width: '100%',
        height: '100%',
        border: 'none',
    },
};

export default function VotingOverlay({ isOpen, onClose }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div style={overlayStyles.container}>
            <div style={overlayStyles.header}>
                <h2 style={overlayStyles.title}>
                    <span style={overlayStyles.dot}></span>
                    SECURE VOTING TERMINAL
                </h2>
                <button
                    style={overlayStyles.closeBtn}
                    onClick={onClose}
                    onMouseEnter={(e) => {
                        e.target.style.borderColor = '#F6FF0D';
                        e.target.style.color = '#F6FF0D';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.borderColor = 'rgba(246, 255, 13, 0.3)';
                        e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                    }}
                >
                    ✕ CLOSE
                </button>
            </div>
            <div style={overlayStyles.iframeContainer}>
                <iframe
                    src="http://localhost:5174/"
                    style={overlayStyles.iframe}
                    title="Voting Application"
                    allow="camera; microphone; geolocation"
                />
            </div>
        </div>,
        document.body
    );
}
