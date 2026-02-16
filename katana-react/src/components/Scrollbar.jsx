import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Scrollbar() {
    const sliderRef = useRef()

    useEffect(() => {
        // Sync custom scrollbar slider height with scroll progress
        gsap.to(sliderRef.current, {
            y: 84, // Move 84px down (120px height - 30% height (36px))
            ease: 'none',
            scrollTrigger: {
                trigger: document.body,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0,
            },
            update: (self) => {
                // Also could use self.progress to calculate position manually if needed
            }
        })
    }, [])

    return (
        <div className="scrollbar">
            <div ref={sliderRef} className="scrollbar-slider"></div>
        </div>
    )
}
