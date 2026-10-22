import type { Locale } from '@mycogni/domain'
import { attentionReasons } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { LanguageSwitch } from '@/features/landing/components/language-switch'
import { SiteFooter } from '@/features/landing/components/site-footer'
import { Wordmark } from '@/shared/components/wordmark'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'
import { OverviewShot, PatientShot, SummaryShot } from './landing-shots'
import { AttentionReasons } from './patient-cells'
import { warnTokens } from './workspace'

const anchors = {
  features: 'recursos',
  summaries: 'resumos',
  privacy: 'privacidade',
  faq: 'perguntas',
} as const

const anchorKeys = ['features', 'summaries', 'privacy', 'faq'] as const

const steps = ['signUp', 'invite', 'follow'] as const

const privacyItems = ['choice', 'mybook', 'revocable', 'verified', 'law'] as const

const questions = ['who', 'account', 'history', 'diagnosis', 'end', 'crisis'] as const

const primary = cn(buttonVariants(), 'h-11 px-5 text-[15px]')

const secondary = cn(
  buttonVariants({ variant: 'outline' }),
  'h-11 px-5 text-[15px] hover:bg-surface',
)

function entry(via: 'sign-up' | 'sign-in'): string {
  return `/continue?to=/pro/join&via=${via}`
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] font-medium tracking-[0.08em] text-emphasis uppercase">{children}</p>
  )
}

function SectionTitle({ id, kicker, title }: { id: string; kicker: string; title: string }) {
  return (
    <div className="max-w-2xl space-y-4">
      <Kicker>{kicker}</Kicker>
      <h2
        id={id}
        className="font-serif text-[34px] leading-[1.06] tracking-[-0.02em] text-balance sm:text-[44px]"
      >
        {title}
      </h2>
    </div>
  )
}

function Header({ chooseLocale }: { chooseLocale: (locale: Locale) => Promise<void> }) {
  const t = useTranslations('professional.join')
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-2">
        <Wordmark />
        <span className="rounded-[4px] border border-foreground/25 px-1.5 py-px text-[11px] leading-4 font-semibold tracking-[0.08em] text-foreground/80">
          <span aria-hidden>{t('badge')}</span>
          <span className="sr-only">{t('badgeLabel')}</span>
        </span>
      </div>
      <nav aria-label={t('nav.label')} className="hidden xl:block">
        <ul className="flex items-center gap-6 text-[15px] whitespace-nowrap text-muted-foreground">
          {anchorKeys.map((key) => (
            <li key={key}>
              <a href={`#${anchors[key]}`} className="transition-colors hover:text-foreground">
                {t(`nav.${key}`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-2 sm:gap-4">
        <LanguageSwitch choose={chooseLocale} />
        <a
          href={entry('sign-in')}
          className="text-[15px] whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('header.signIn')}
        </a>
        <a
          href={entry('sign-up')}
          className={cn(primary, 'h-9 px-3.5 text-sm whitespace-nowrap max-sm:hidden')}
        >
          {t('header.signUp')}
        </a>
      </div>
    </header>
  )
}

function Hero() {
  const t = useTranslations('professional.join')
  return (
    <section aria-labelledby="pro-hero" className="pt-10 pb-20 sm:pt-16 lg:pb-28">
      <div className="animate-rise max-w-3xl space-y-7 motion-reduce:animate-none">
        <Kicker>{t('hero.kicker')}</Kicker>
        <h1
          id="pro-hero"
          className="font-serif text-[44px] leading-[1.02] tracking-[-0.025em] text-balance sm:text-[60px]"
        >
          {t('hero.title')}
        </h1>
        <p className="max-w-[34rem] text-lg leading-relaxed text-pretty text-muted-foreground">
          {t('hero.lead')}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={entry('sign-up')} className={primary}>
            {t('signUp')}
          </a>
          <a href={entry('sign-in')} className={secondary}>
            {t('signIn')}
          </a>
        </div>
        <ul className="grid gap-x-8 gap-y-2 pt-2 text-[14px] text-muted-foreground lg:flex">
          {(['verified', 'consent', 'law'] as const).map((point) => (
            <li key={point} className="flex items-start gap-2.5">
              <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-emphasis" />
              {t(`hero.points.${point}`)}
            </li>
          ))}
        </ul>
      </div>
      <div
        className="mt-14 animate-rise motion-reduce:animate-none sm:mt-16 lg:-mx-6"
        style={{ animationDelay: '120ms' }}
      >
        <OverviewShot />
      </div>
    </section>
  )
}

function Features() {
  const t = useTranslations('professional.join.features')
  const blocks = ['checkIns', 'screenings'] as const
  return (
    <section
      id={anchors.features}
      aria-labelledby="pro-features"
      className="scroll-mt-6 border-t border-rule py-20 sm:py-28"
    >
      <SectionTitle id="pro-features" kicker={t('kicker')} title={t('title')} />
      <div className="mt-14 grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="space-y-10">
          {blocks.map((block) => (
            <div key={block} className="space-y-2">
              <h3 className="font-serif text-[24px] leading-tight">{t(`${block}.title`)}</h3>
              <p className="max-w-md leading-relaxed text-muted-foreground">{t(`${block}.body`)}</p>
            </div>
          ))}
          <div className="space-y-3">
            <h3 className="font-serif text-[24px] leading-tight">{t('signals.title')}</h3>
            <p className="max-w-md leading-relaxed text-muted-foreground">{t('signals.body')}</p>
            <div className="pt-1">
              <AttentionReasons reasons={attentionReasons} />
            </div>
          </div>
        </div>
        <PatientShot />
      </div>
    </section>
  )
}

function Summaries() {
  const t = useTranslations('professional.join.summaries')
  return (
    <section
      id={anchors.summaries}
      aria-labelledby="pro-summaries"
      className="scroll-mt-6 border-t border-rule py-20 sm:py-28"
    >
      <div className="grid items-start gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="space-y-6">
          <SectionTitle id="pro-summaries" kicker={t('kicker')} title={t('title')} />
          <p className="max-w-lg text-lg leading-relaxed text-pretty text-muted-foreground">
            {t('body')}
          </p>
          <ul className="space-y-3">
            {(['consent', 'diagnosis', 'decide'] as const).map((point) => (
              <li key={point} className="flex items-start gap-3 leading-relaxed">
                <span aria-hidden className="mt-[10px] h-px w-4 shrink-0 bg-foreground/40" />
                {t(`points.${point}`)}
              </li>
            ))}
          </ul>
        </div>
        <SummaryShot />
      </div>
    </section>
  )
}

function Privacy() {
  const t = useTranslations('professional.join.privacy')
  return (
    <section
      id={anchors.privacy}
      aria-labelledby="pro-privacy"
      className="scroll-mt-6 border-t border-rule py-20 sm:py-28"
    >
      <SectionTitle id="pro-privacy" kicker={t('kicker')} title={t('title')} />
      <ul className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {privacyItems.map((item) => (
          <li key={item} className="space-y-2">
            <h3 className="text-[17px] font-medium">{t(`items.${item}.title`)}</h3>
            <p className="leading-relaxed text-muted-foreground">{t(`items.${item}.body`)}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Steps() {
  const t = useTranslations('professional.join.steps')
  return (
    <section aria-labelledby="pro-steps" className="border-t border-rule py-20 sm:py-28">
      <SectionTitle id="pro-steps" kicker={t('kicker')} title={t('title')} />
      <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
        {steps.map((step, index) => (
          <li key={step} className="space-y-3">
            <span className="font-serif text-[40px] leading-none text-emphasis">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="text-[17px] font-medium">{t(`${step}.title`)}</h3>
            <p className="leading-relaxed text-muted-foreground">{t(`${step}.body`)}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Questions() {
  const t = useTranslations('professional.join.faq')
  return (
    <section
      id={anchors.faq}
      aria-labelledby="pro-faq"
      className="scroll-mt-6 border-t border-rule py-20 sm:py-28"
    >
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <SectionTitle id="pro-faq" kicker={t('kicker')} title={t('title')} />
        <div className="divide-y divide-rule border-y border-rule">
          {questions.map((key) => (
            <details key={key} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                {t(`questions.${key}.question`)}
                <span
                  aria-hidden
                  className="mt-0.5 text-xl leading-none font-normal text-muted-foreground transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
                {t(`questions.${key}.answer`)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function Closing() {
  const t = useTranslations('professional.join')
  return (
    <section
      aria-labelledby="pro-closing"
      className="mb-20 rounded-[10px] bg-primary px-6 py-14 text-primary-foreground sm:px-12 sm:py-20"
    >
      <div className="max-w-2xl space-y-5">
        <h2
          id="pro-closing"
          className="font-serif text-[34px] leading-[1.06] tracking-[-0.02em] text-balance sm:text-[44px]"
        >
          {t('closing.title')}
        </h2>
        <p className="text-lg leading-relaxed text-pretty opacity-80">{t('closing.body')}</p>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <a
            href={entry('sign-up')}
            className={cn(
              buttonVariants(),
              'h-11 bg-primary-foreground px-5 text-[15px] text-primary hover:bg-primary-foreground/90',
            )}
          >
            {t('signUp')}
          </a>
          <a
            href={entry('sign-in')}
            className="inline-flex h-11 items-center px-1 text-[15px] underline decoration-1 underline-offset-4 opacity-85 hover:opacity-100"
          >
            {t('signIn')}
          </a>
        </div>
      </div>
    </section>
  )
}

export function ProLanding({ chooseLocale }: { chooseLocale: (locale: Locale) => Promise<void> }) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-5 sm:px-10', warnTokens)}>
      <Header chooseLocale={chooseLocale} />
      <main>
        <Hero />
        <Features />
        <Summaries />
        <Privacy />
        <Steps />
        <Questions />
        <Closing />
      </main>
      <SiteFooter />
    </div>
  )
}
