import { useState } from 'react'
import AnimatedHeadline from './AnimatedHeadline'
import FadeIn from './FadeIn'

export default function Newsletter() {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (email) {
            setSubmitted(true)
        }
    }

    return (
        <section className="newsletter" id="newsletter-section">
            <div className="section-container">
                <AnimatedHeadline
                    text="request early access."
                    tag="h2"
                    className="typo-h2"
                />
                <FadeIn delay={200}>
                    <p className="typo-p" style={{ maxWidth: 560, marginTop: 16, marginBottom: 32 }}>
                        join the waitlist to deploy kwote for your organization.
                        get priority onboarding, enterprise support, and custom governance configuration.
                    </p>
                </FadeIn>

                <FadeIn delay={400}>
                    {submitted ? (
                        <div className="newsletter-success">
                            <p>✓ you're on the list. we'll be in touch soon.</p>
                        </div>
                    ) : (
                        <form className="newsletter-form" onSubmit={handleSubmit}>
                            <input
                                className="newsletter-input"
                                type="email"
                                placeholder="your corporate email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button className="newsletter-submit" type="submit">
                                request access →
                            </button>
                        </form>
                    )}
                </FadeIn>
            </div>
        </section>
    )
}
