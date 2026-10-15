import { useTranslations } from 'next-intl'
import { Section } from '@/shared/components/section'

const sharedItems = ['checkIns', 'screenings'] as const

const privateItems = ['account', 'others'] as const

const itemStyle = 'flex gap-3'

const dotStyle = 'mt-[0.55em] size-1.5 shrink-0 rounded-full bg-foreground/40'

export function SharingSummary({ name }: { name: string }) {
  const t = useTranslations('care.sharing')

  return (
    <div className="space-y-8">
      <Section title={t('sharedTitle', { name })}>
        <ul className="space-y-2 leading-snug">
          {sharedItems.map((item) => (
            <li key={item} className={itemStyle}>
              <span aria-hidden className={dotStyle} />
              {t(`shared.${item}`)}
            </li>
          ))}
        </ul>
      </Section>
      <Section title={t('privateTitle')}>
        <ul className="space-y-2 leading-snug">
          {privateItems.map((item) => (
            <li key={item} className={itemStyle}>
              <span aria-hidden className={dotStyle} />
              {t(`private.${item}`)}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
