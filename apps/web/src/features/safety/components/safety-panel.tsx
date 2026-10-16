import { crisisLinesFor, type SupportLevel } from '@mycogni/domain'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { CloseIcon } from '@/shared/components/icons'
import { WhatsappRows } from '@/shared/components/whatsapp-rows'
import { emergencyContactsOf, type LinkedProfessional } from '@/shared/lib/emergency-contacts'
import { cn } from '@/shared/lib/utils'

interface SafetyPanelProps {
  level: SupportLevel
  professionals: readonly LinkedProfessional[]
  intro?: boolean
  onDismiss?: () => void
  className?: string
}

export function SafetyPanel({
  level,
  professionals,
  intro = true,
  onDismiss,
  className,
}: SafetyPanelProps) {
  const t = useTranslations('safety')
  const format = useFormatter()
  const lines = crisisLinesFor(useLocale())
  const contacts = level === 'urgent' ? emergencyContactsOf(professionals) : []
  const names = professionals
    .filter((professional) => !contacts.some((contact) => contact.name === professional.name))
    .map((professional) => professional.name)

  return (
    <section
      aria-label={t('title')}
      data-safety={level}
      className={cn('rounded-[8px] bg-mist px-4 py-3 text-left text-sm leading-relaxed', className)}
    >
      {(intro || onDismiss !== undefined) && (
        <div className="flex items-start justify-between gap-3">
          {intro && <p className="pt-0.5 text-[15px] font-medium text-pretty">{t(level)}</p>}
          {onDismiss !== undefined && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label={t('dismiss')}
              className="-mt-0.5 -mr-2 ml-auto inline-flex size-8 shrink-0 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
            >
              <CloseIcon className="size-4" />
            </button>
          )}
        </div>
      )}
      <ul aria-label={t('lines')} className="flex flex-wrap gap-x-5">
        {lines.map((line) => (
          <li key={line.phone}>
            <a href={`tel:${line.phone}`} className="inline-flex items-baseline gap-1.5 py-1">
              <span className="font-medium text-foreground tabular-nums underline decoration-1 underline-offset-4">
                {line.display}
              </span>{' '}
              <span className="text-muted-foreground">{line.name}</span>
            </a>
          </li>
        ))}
      </ul>
      <WhatsappRows contacts={contacts} />
      {names.length > 0 && (
        <p className="text-muted-foreground">
          {t('professionals', { count: names.length, names: format.list(names) })}
        </p>
      )}
    </section>
  )
}
