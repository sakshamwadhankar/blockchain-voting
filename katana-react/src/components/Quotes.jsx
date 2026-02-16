import FadeIn from './FadeIn'
import SectionParticles from './SectionParticles'

const StarIcon = ({ color = '#F6FF0D' }) => (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 0L43.09 36.91L80 40L43.09 43.09L40 80L36.91 43.09L0 40L36.91 36.91L40 0Z" fill={color} />
    </svg>
)

const quotes = [
    {
        text: '"kwote transforms corporate voting — making internal elections as trustworthy as public blockchain transactions."',
        author: 'chief technology officer',
        role: 'fortune 500 enterprise',
        color: '#F6FF0D',
    },
    {
        text: '"the biometric verification layer gives us absolute confidence that every vote is cast by a real, authorized employee."',
        author: 'head of compliance',
        role: 'global financial institution',
        color: '#00FF94',
    },
    {
        text: '"real-time result streaming with full voter anonymity — this is the future of transparent corporate decision-making."',
        author: 'director of operations',
        role: 'international conglomerate',
        color: '#FF006B',
    },
]

export default function Quotes() {
    return (
        <section className="quotes" id="quotes-section">
            <SectionParticles variant="white" density={25} />
            <div className="quotes-container">
                {quotes.map((q, i) => (
                    <FadeIn key={i} delay={i * 200}>
                        <div className="quote-item">
                            <div className="quote-icon">
                                <StarIcon color={q.color} />
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
