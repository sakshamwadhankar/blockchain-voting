import { useRef, useEffect } from 'react'

/**
 * Section-level particle effect. Renders floating, drifting particles
 * inside whichever section it's placed in. Variants control color/behavior.
 *
 * variant: 'blue' | 'yellow' | 'white' | 'mixed'
 * density: number of particles (default 40)
 */
export default function SectionParticles({ variant = 'white', density = 40 }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        let animationId
        let particles = []

        const colors = {
            blue: ['rgba(65,157,231,', 'rgba(20,67,172,', 'rgba(203,233,250,'],
            yellow: ['rgba(246,255,13,', 'rgba(249,166,123,', 'rgba(252,252,252,'],
            white: ['rgba(252,252,252,', 'rgba(200,220,255,', 'rgba(252,252,252,'],
            mixed: ['rgba(65,157,231,', 'rgba(246,255,13,', 'rgba(252,252,252,', 'rgba(201,197,230,'],
        }

        function resize() {
            const rect = canvas.parentElement.getBoundingClientRect()
            canvas.width = rect.width
            canvas.height = rect.height
        }

        function createParticles() {
            particles = []
            const palette = colors[variant] || colors.white
            for (let i = 0; i < density; i++) {
                const colorBase = palette[Math.floor(Math.random() * palette.length)]
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 2 + 0.5,
                    colorBase,
                    opacity: Math.random() * 0.4 + 0.1,
                    driftX: (Math.random() - 0.5) * 0.3,
                    driftY: (Math.random() - 0.5) * 0.15 - 0.1, // slight upward bias
                    twinkleSpeed: Math.random() * 0.015 + 0.005,
                    twinkleOffset: Math.random() * Math.PI * 2,
                })
            }
        }

        function draw(time) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            for (const p of particles) {
                // Drift
                p.x += p.driftX
                p.y += p.driftY

                // Wrap around
                if (p.x < -5) p.x = canvas.width + 5
                if (p.x > canvas.width + 5) p.x = -5
                if (p.y < -5) p.y = canvas.height + 5
                if (p.y > canvas.height + 5) p.y = -5

                // Twinkle
                const twinkle = Math.sin(time * p.twinkleSpeed + p.twinkleOffset) * 0.5 + 0.5
                const alpha = p.opacity * twinkle

                // Draw particle
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
                ctx.fillStyle = `${p.colorBase}${alpha})`
                ctx.fill()

                // Glow for larger particles
                if (p.radius > 1.5) {
                    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4)
                    grad.addColorStop(0, `${p.colorBase}${alpha * 0.3})`)
                    grad.addColorStop(1, `${p.colorBase}0)`)
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2)
                    ctx.fillStyle = grad
                    ctx.fill()
                }
            }

            animationId = requestAnimationFrame(draw)
        }

        resize()
        createParticles()
        animationId = requestAnimationFrame(draw)

        window.addEventListener('resize', () => { resize(); createParticles() })

        return () => {
            cancelAnimationFrame(animationId)
        }
    }, [variant, density])

    return (
        <canvas
            ref={canvasRef}
            className="section-particles"
            aria-hidden="true"
        />
    )
}
