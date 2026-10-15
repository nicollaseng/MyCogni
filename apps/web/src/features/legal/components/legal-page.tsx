import type { Locale } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { SiteFooter } from '@/features/landing/components/site-footer'
import { SiteHeader } from '@/features/landing/components/site-header'
import type { LegalDocument } from '../content'

interface LegalPageProps {
  document: LegalDocument
  chooseLocale: (locale: Locale) => Promise<void>
}

export function LegalPage({ document, chooseLocale }: LegalPageProps) {
  const t = useTranslations('legal')

  return (
    <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
      <SiteHeader chooseLocale={chooseLocale} />
      <main className="max-w-2xl py-16 sm:py-24">
        <h1 className="font-serif text-[44px] leading-[1.04] tracking-[-0.02em] sm:text-[56px]">
          {document.title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{document.summary}</p>
        <p className="mt-6 border-l-2 border-rule pl-4 text-sm text-muted-foreground">
          {t('draftNotice')}
        </p>
        <div className="mt-12 divide-y divide-rule border-y border-rule">
          {document.sections.map((section) => (
            <section key={section.heading} className="py-8">
              <h2 className="font-serif text-2xl tracking-[-0.01em]">{section.heading}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
