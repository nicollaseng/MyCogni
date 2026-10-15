import { crisisLinesFor, type AssistantMode } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import type { SupportContact } from '../model'

interface SupportCardProps {
  mode: AssistantMode
  contacts: readonly SupportContact[]
}

const phoneLink =
  'font-medium text-foreground tabular-nums underline decoration-1 underline-offset-4'

export function SupportCard({ mode, contacts }: SupportCardProps) {
  const t = useTranslations('assistant')
  const kinds = useTranslations('common.professionalKinds')
  const lines = crisisLinesFor(useLocale())

  if (mode === 'professional') {
    return (
      <div
        role="note"
        aria-label={t('professionalSupport.title')}
        className="space-y-1 rounded-[8px] bg-mist px-4 py-3.5 text-sm leading-relaxed"
      >
        <p className="font-medium">{t('professionalSupport.title')}</p>
        <p className="text-muted-foreground">{t('professionalSupport.body')}</p>
      </div>
    )
  }

  return (
    <section
      aria-label={t('support.title')}
      data-support="card"
      className="space-y-3 rounded-[8px] bg-mist px-4 py-3.5 text-sm leading-relaxed"
    >
      <div className="space-y-1">
        <p className="text-[15px] font-medium">{t('support.title')}</p>
        <p className="text-muted-foreground">{t('support.body')}</p>
      </div>
      {contacts.length > 0 && (
        <div className="space-y-1">
          <p className="font-medium">{t('support.professionals')}</p>
          <ul className="space-y-0.5">
            {contacts.map((contact) => (
              <li key={`${contact.name}-${contact.kind}`}>
                {contact.name}
                <span className="text-muted-foreground"> · {kinds(contact.kind)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="space-y-1">
        <p className="font-medium">{t('support.lines')}</p>
        <ul className="space-y-0.5">
          {lines.map((line) => (
            <li key={line.phone}>
              <a href={`tel:${line.phone}`} className={phoneLink}>
                {line.display}
              </a>{' '}
              <span className="text-muted-foreground">{line.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
