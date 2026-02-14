import { useEffect, useRef, useState } from 'react'

export default function AnimatedHeadline({ text, text2, tag = 'h2', className = '' }) {
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
            { threshold: 0.3 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [])

    const Tag = tag

    const renderLine = (lineText, startIndex = 0) => {
        const words = lineText.split(' ')
        let charIndex = startIndex

        return words.map((word, wi) => {
            const wordChars = word.split('').map((char, ci) => {
                const idx = charIndex++
                return (
                    <i
                        key={idx}
                        style={{
                            transitionDelay: `${idx * 13}ms`,
                        }}
                    >
                        {char}
                    </i>
                )
            })
            // Add space between words
            if (wi < words.length - 1) {
                charIndex++ // count space
                return (
                    <span key={`word-${wi}`} aria-hidden="true" data-len={word.length}>
                        {wordChars}
                        <i style={{ transitionDelay: `${(charIndex - 1) * 13}ms` }}>{'\u00A0'}</i>
                    </span>
                )
            }
            return (
                <span key={`word-${wi}`} aria-hidden="true" data-len={word.length}>
                    {wordChars}
                </span>
            )
        })
    }

    const line1Length = text.length + 1 // +1 for line break gap

    return (
        <Tag ref={ref} className={`animated-text ${visible ? 'visible' : ''} ${className}`}
            aria-label={text2 ? `${text}\n${text2}` : text}>
            <span aria-hidden="true">
                {renderLine(text, 0)}
            </span>
            {text2 && (
                <>
                    <br />
                    <span aria-hidden="true">
                        {renderLine(text2, line1Length)}
                    </span>
                </>
            )}
        </Tag>
    )
}
