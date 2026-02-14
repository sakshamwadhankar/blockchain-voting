import FadeIn from './FadeIn'
import SectionParticles from './SectionParticles'

const quotes = [
    {
        text: '"kwote transforms corporate governance — making internal elections as trustworthy as public blockchain transactions."',
        author: 'chief technology officer',
        role: 'fortune 500 enterprise',
        image: '/site_assets/images/storyblok_402x213_quote-1-2.svg',
    },
    {
        text: '"the biometric verification layer gives us absolute confidence that every vote is cast by a real, authorized employee."',
        author: 'head of compliance',
        role: 'global financial institution',
        image: '/site_assets/images/storyblok_402x213_quote-2.svg',
    },
    {
        text: '"real-time result streaming with full voter anonymity — this is the future of transparent corporate decision-making."',
        author: 'director of operations',
        role: 'international conglomerate',
        image: '/site_assets/images/storyblok_402x213_quote-3.svg',
    },
]

export default function Quotes() {
    return (
        <section className="section quotes" id="quotes-section">
            <SectionParticles variant="white" density={25} />
            <div className="quotes-container">
                {quotes.map((q, i) => (
                    <FadeIn key={i} delay={i * 200}>
                        <div className="quote-item">
                            <div className="quote-icon">
                                <img src={q.image} alt={q.author} />
                            </div>
                            <p className="quote-text">{q.text}</p>
                            <p className="quote-author">
                                {q.author} — {q.role}
                            </p>
                        </div>
                    </FadeIn>
                ))}
            </div>
        </section>
    )
}
