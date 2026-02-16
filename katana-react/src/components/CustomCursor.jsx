import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

export default function CustomCursor() {
    const cursorRef = useRef(null)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    useEffect(() => {
        if (isTouchDevice || !cursorRef.current) return

        const cursor = cursorRef.current
        let mouseX = 0
        let mouseY = 0
        let cursorX = 0
        let cursorY = 0

        // Initial position to center of screen
        mouseX = window.innerWidth / 2
        mouseY = window.innerHeight / 2
        cursorX = mouseX
        cursorY = mouseY

        const onMouseMove = (e) => {
            mouseX = e.clientX
            mouseY = e.clientY
        }

        // Add event listeners
        window.addEventListener('mousemove', onMouseMove)

        // Animation loop for smooth trailing
        const animateCursor = () => {
            // Linear interpolation for smooth movement
            const dt = 1.0 - Math.pow(1.0 - 0.2, gsap.ticker.deltaRatio())
            cursorX += (mouseX - cursorX) * dt
            cursorY += (mouseY - cursorY) * dt

            if (cursor) {
                cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`
            }

            requestAnimationFrame(animateCursor)
        }

        const animationId = requestAnimationFrame(animateCursor)

        // Element hover effects
        const handleLinkHover = () => {
            gsap.to(cursor, {
                scale: 1.5,
                duration: 0.3,
                ease: 'power2.out'
            })
            cursor.classList.add('hovering')
        }

        const handleLinkLeave = () => {
            gsap.to(cursor, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            })
            cursor.classList.remove('hovering')
        }

        // Attach to interactive elements
        const links = document.querySelectorAll('a, button, input')
        links.forEach(link => {
            link.addEventListener('mouseenter', handleLinkHover)
            link.addEventListener('mouseleave', handleLinkLeave)
        })

        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            cancelAnimationFrame(animationId)
            links.forEach(link => {
                link.removeEventListener('mouseenter', handleLinkHover)
                link.removeEventListener('mouseleave', handleLinkLeave)
            })
        }
    }, [isTouchDevice])

    if (isTouchDevice) return null

    return (
        <div ref={cursorRef} className="custom-cursor">
            <img src="/assets/images/cursor-pointer.svg" alt="" />
        </div>
    )
}
