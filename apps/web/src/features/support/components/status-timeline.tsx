import type { SupportTicket } from '@mycogni/contracts'
import type { SupportTicketStatus } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { formatDateTime } from '@/features/professional/dates'
import { cn } from '@/shared/lib/utils'
import { statusDots } from './ticket-status'

type Dated = Pick<SupportTicket, 'status' | 'createdAt' | 'takenAt' | 'closedAt'>

interface Step {
  status: SupportTicketStatus
  at: string | null
}

export function timelineSteps({ status, createdAt, takenAt, closedAt }: Dated): Step[] {
  const skippedProgress = status === 'closed' && takenAt === null
  return [
    { status: 'pending', at: createdAt },
    ...(skippedProgress ? [] : [{ status: 'in_progress' as const, at: takenAt }]),
    { status: 'closed', at: closedAt },
  ]
}

interface StatusTimelineProps {
  ticket: Dated
  timeZone: string
}

export function StatusTimeline({ ticket, timeZone }: StatusTimelineProps) {
  const t = useTranslations('support')
  const locale = useLocale()
  const steps = timelineSteps(ticket)

  return (
    <ol aria-label={t('detail.timeline')} className="space-y-0">
      {steps.map((step, index) => {
        const reached = step.at !== null
        const current = step.status === ticket.status
        const last = index === steps.length - 1
        return (
          <li
            key={step.status}
            aria-current={current ? 'step' : undefined}
            className="relative grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3 pb-5 last:pb-0"
          >
            {!last && (
              <span
                aria-hidden
                className={cn(
                  'absolute top-4 bottom-0 left-[7px] w-px',
                  steps[index + 1]?.at === null ? 'bg-rule' : 'bg-muted-foreground/40',
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                'relative mt-1.5 size-2.5 justify-self-center rounded-full',
                reached
                  ? statusDots[step.status]
                  : 'bg-background ring-1 ring-muted-foreground/50 ring-inset',
              )}
            />
            <div className="min-w-0 space-y-0.5">
              <p
                className={cn(
                  'text-[15px]',
                  current ? 'font-medium' : !reached && 'text-muted-foreground',
                )}
              >
                {t(`statuses.${step.status}`)}
              </p>
              <p className="text-sm text-muted-foreground">
                {step.at === null ? (
                  t('detail.waiting')
                ) : (
                  <>
                    {t(`detail.steps.${step.status}`)}
                    {' · '}
                    <time dateTime={step.at}>
                      {formatDateTime(new Date(step.at), timeZone, locale)}
                    </time>
                  </>
                )}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
