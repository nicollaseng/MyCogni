import { useTranslations } from 'next-intl'
import { Panel, Section } from '@/shared/components/section'

const sharedItems = ['checkIns', 'screenings'] as const

const privateItems = ['account', 'others'] as const

export function SharingSummary({ name }: { name: string }) {
  const t = useTranslations('care.sharing')

  return (
    <div className="space-y-8">
      <Section title={t('sharedTitle', { name })}>
        <Panel className="py-3">
          <ul className="space-y-2.5 py-1 leading-snug">
            {sharedItems.map((item) => (
              <li key={item}>{t(`shared.${item}`)}</li>
            ))}
          </ul>
        </Panel>
      </Section>
      <Section title={t('privateTitle')}>
        <Panel className="py-3">
          <ul className="space-y-2.5 py-1 leading-snug">
            {privateItems.map((item) => (
              <li key={item}>{t(`private.${item}`)}</li>
            ))}
          </ul>
        </Panel>
      </Section>
    </div>
  )
}
