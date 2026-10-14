import { SiteFooter } from './site-footer'
import { AiSection } from './ai-section'
import { ClosingCta } from './closing-cta'
import { Faq } from './faq'
import { HowItWorks } from './how-it-works'
import { MoodDemo } from './mood-demo'
import { PrivacySection } from './privacy-section'
import { SiteHeader } from './site-header'

export function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
      <SiteHeader />
      <main>
        <section
          aria-label="Experimente"
          className="flex min-h-[calc(100dvh-92px)] items-center py-10"
        >
          <MoodDemo />
        </section>
        <HowItWorks />
        <AiSection />
        <PrivacySection />
        <Faq />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  )
}
