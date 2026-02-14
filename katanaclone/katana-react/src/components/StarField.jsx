import { useRef, useEffect } from 'react'

export default function StarField() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        let animationId
        let stars = []
        const STAR_COUNT = 300
        const SHOOT_INTERVAL = 4000 // ms between shooting stars

        function resize() {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        function createStars() {
            stars = []
            for (let i = 0; i < STAR_COUNT; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 1.5 + 0.3,
                    opacity: Math.random() * 0.8 + 0.2,
                    twinkleSpeed: Math.random() * 0.02 + 0.005,
                    twinkleOffset: Math.random() * Math.PI * 2,
                })
            }
        }

        // Shooting stars
        let shootingStars = []
        let lastShoot = 0

        function spawnShootingStar(time) {
            shootingStars.push({
                x: Math.random() * canvas.width * 0.8,
                y: Math.random() * canvas.height * 0.3,
                length: Math.random() * 80 + 40,
                speed: Math.random() * 8 + 6,
                angle: (Math.random() * 20 + 20) * (Math.PI / 180), // 20-40 degrees
                opacity: 1,
                life: 0,
                maxLife: Math.random() * 40 + 30,
            })
            lastShoot = time
        }

        function draw(time) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw static stars with twinkling
            for (const star of stars) {
                const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.4 + 0.6
                const alpha = star.opacity * twinkle

                ctx.beginPath()
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
                ctx.fill()

                // Subtle glow on brighter stars
                if (star.radius > 1) {
                    ctx.beginPath()
                    ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2)
                    const gradient = ctx.createRadialGradient(
                        star.x, star.y, 0,
                        star.x, star.y, star.radius * 3
                    )
                    gradient.addColorStop(0, `rgba(200, 220, 255, ${alpha * 0.15})`)
                    gradient.addColorStop(1, 'rgba(200, 220, 255, 0)')
                    ctx.fillStyle = gradient
                    ctx.fill()
                }
            }

            // Spawn shooting stars periodically
            if (time - lastShoot > SHOOT_INTERVAL) {
                spawnShootingStar(time)
            }

            // Draw shooting stars
            for (let i = shootingStars.length - 1; i >= 0; i--) {
                const s = shootingStars[i]
                s.life++
                s.x += Math.cos(s.angle) * s.speed
                s.y += Math.sin(s.angle) * s.speed
                s.opacity = 1 - (s.life / s.maxLife)

                if (s.life >= s.maxLife) {
                    shootingStars.splice(i, 1)
                    continue
                }

                // Draw trail
                const tailX = s.x - Math.cos(s.angle) * s.length
                const tailY = s.y - Math.sin(s.angle) * s.length

                const gradient = ctx.createLinearGradient(tailX, tailY, s.x, s.y)
                gradient.addColorStop(0, `rgba(255, 255, 255, 0)`)
                gradient.addColorStop(1, `rgba(255, 255, 255, ${s.opacity * 0.8})`)

                ctx.beginPath()
                ctx.moveTo(tailX, tailY)
                ctx.lineTo(s.x, s.y)
                ctx.strokeStyle = gradient
                ctx.lineWidth = 1.5
                ctx.stroke()

                // Bright head
                ctx.beginPath()
                ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`
                ctx.fill()
            }

            animationId = requestAnimationFrame(draw)
        }

        resize()
        createStars()
        animationId = requestAnimationFrame(draw)

        const handleResize = () => {
            resize()
            createStars()
        }

        window.addEventListener('resize', handleResize)

        return () => {
            cancelAnimationFrame(animationId)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="starfield"
            aria-hidden="true"
        />
    )
}
