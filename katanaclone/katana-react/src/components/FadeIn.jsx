import { useEffect, useRef, useState } from 'react'

export default function FadeIn({ children, delay = 0, className = '' }) {
    const ref = useRef()
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.15 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [])

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(30px)',
                transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
            }}
        >
            {children}
        </div>
    )
}
