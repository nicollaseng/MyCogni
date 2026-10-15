import { useTranslations } from 'next-intl'
import { PageTitle } from '@/shared/components/page-title'
import { Panel } from '@/shared/components/section'
import { buttonVariants } from '@/shared/ui/button'

const offers = ['checkIns', 'screenings', 'consent'] as const

function entry(via: 'sign-up' | 'sign-in'): string {
  return `/continue?to=/pro/join&via=${via}`
}

export function JoinIntro() {
  const t = useTranslations('professional.join')

  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <PageTitle kicker={t('kicker')} title={t('title')} description={t('lead')} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={entry('sign-up')} className={buttonVariants({ shape: 'pill' })}>
            {t('signUp')}
          </a>
          <a
            href={entry('sign-in')}
            className={buttonVariants({ variant: 'outline', shape: 'pill' })}
          >
            {t('signIn')}
          </a>
        </div>
      </div>

      <section aria-labelledby="join-offers" className="space-y-3">
        <h2 id="join-offers" className="px-1 text-sm text-muted-foreground">
          {t('offersTitle')}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {offers.map((offer) => (
            <li key={offer}>
              <Panel className="h-full space-y-2 py-5">
                <h3 className="font-serif text-[22px] leading-tight">
                  {t(`offers.${offer}.title`)}
                </h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {t(`offers.${offer}.body`)}
                </p>
              </Panel>
            </li>
          ))}
        </ul>
      </section>

      <p className="max-w-[36rem] px-1 text-sm leading-relaxed text-pretty text-muted-foreground">
        {t('verification')}
      </p>
    </div>
  )
}
