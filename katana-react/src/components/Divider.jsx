import FadeIn from './FadeIn'

const videoVariant = {
    images: [
        '/assets/images/divider-kat-01.jpg',
        '/assets/images/divider-kat-02.jpg',
        '/assets/images/divider-kat-03.jpg',
    ],
}

const imagesVariant = {
    images: [
        '/assets/images/divider-kat-04.jpg',
        '/assets/images/divider-kat-05.jpg',
        '/assets/images/divider-kat-06.jpg',
    ],
}

export default function Divider({ variant = 'video' }) {
    const config = variant === 'video' ? videoVariant : imagesVariant

    return (
        <section className="divider-section">
            <FadeIn>
                <div className="divider-inner">
                    {config.images.map((src, i) => (
                        <div key={i} className="divider-element">
                            <img src={src} alt={`Katana visual ${i + 1}`} loading="lazy" />
                        </div>
                    ))}
                </div>
            </FadeIn>
        </section>
    )
}
