import { useEffect, useRef } from 'react'

export default function SectionTransition({ children, className = '' }) {
    const sectionRef = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible')
                    }
                })
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -80px 0px',
            }
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current)
            }
        }
    }, [])

    return (
        <div ref={sectionRef} className={className}>
            {children}
        </div>
    )
}
