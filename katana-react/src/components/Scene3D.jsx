import { Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, Float } from '@react-three/drei'
import * as THREE from 'three'

function Model({ url, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0] }) {
    const { scene } = useGLTF(url)
    // Clone scene for multiple instances
    const clonedScene = useMemo(() => scene.clone(), [scene])

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1} floatingRange={[-0.1, 0.1]}>
            <primitive
                object={clonedScene}
                scale={scale}
                position={position}
                rotation={rotation}
            />
        </Float>
    )
}

function FloatingModels() {
    const group = useRef()

    useFrame((state) => {
        // Parallax effect based on window scroll
        const scrollY = window.scrollY
        const scrollMax = document.body.scrollHeight - window.innerHeight
        const scrollProgress = scrollY / (scrollMax || 1)

        if (group.current) {
            // Rotate slightly based on mouse
            group.current.rotation.y = THREE.MathUtils.lerp(
                group.current.rotation.y,
                -state.pointer.x * 0.1,
                0.1
            )

            // Move up based on scroll
            group.current.position.y = THREE.MathUtils.lerp(
                group.current.position.y,
                scrollProgress * 5,
                0.1
            )
        }
    })

    return (
        <group ref={group}>
            {/* Hero Section Coins */}
            <Model url="/assets/models/coin2.glb" scale={1.5} position={[2, 1, 0]} rotation={[0.5, 0.5, 0]} />
            <Model url="/assets/models/ausd-coin.glb" scale={1.2} position={[-2.5, -1, 1]} rotation={[0, 0.5, 0.5]} />
            <Model url="/assets/models/sushi-coin.glb" scale={0.8} position={[3, -2, -2]} rotation={[0.2, 0, 0]} />

            {/* Lower Section Swords/Items (visible when scrolled) */}
            <Model url="/assets/models/sword.glb" scale={0.5} position={[0, -8, 0]} rotation={[0, 0, Math.PI / 4]} />
            <Model url="/assets/models/liquidity-ring.glb" scale={2} position={[0, -8, -2]} rotation={[Math.PI / 2, 0, 0]} />
        </group>
    )
}

export default function Scene3D() {
    return (
        <div className="canvas-container" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }}>
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ alpha: true, antialias: true }} dpr={[1, 1.5]}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#419DE7" />

                {/* Environment disabled to prevent CDN loading issues */}
                {/* <Environment preset="city" /> */}

                <Suspense fallback={null}>
                    <FloatingModels />
                </Suspense>
            </Canvas>
        </div>
    )
}

// Preload models for smoother experience
useGLTF.preload('/assets/models/coin2.glb')
useGLTF.preload('/assets/models/ausd-coin.glb')
useGLTF.preload('/assets/models/sushi-coin.glb')
useGLTF.preload('/assets/models/sword.glb')
useGLTF.preload('/assets/models/liquidity-ring.glb')
