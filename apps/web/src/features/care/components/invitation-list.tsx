import type { ReceivedInvitation } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Section } from '@/shared/components/section'
import { formatDay } from '../format-day'
import { groupInvitations, statusDate } from '../invitations'

interface InvitationListProps {
  invitations: readonly ReceivedInvitation[]
  timeZone: string
}

function InvitationSummary({
  invitation,
  timeZone,
  action,
}: {
  invitation: ReceivedInvitation
  timeZone: string
  action?: ReactNode
}) {
  const t = useTranslations('care.invites')
  const kinds = useTranslations('common.professionalKinds')
  const locale = useLocale()
  const date = formatDay(statusDate(invitation), timeZone, locale)

  return (
    <span className="block space-y-0.5">
      <span className="flex items-baseline justify-between gap-4">
        <span className="min-w-0 truncate">{invitation.professional.name}</span>
        {action}
      </span>
      <span className="block text-sm text-pretty text-muted-foreground">
        {kinds(invitation.professional.kind)} · {t(`dates.${invitation.status}`, { date })}
      </span>
    </span>
  )
}

export function InvitationList({ invitations, timeZone }: InvitationListProps) {
  const t = useTranslations('care.invites')
  const groups = groupInvitations(invitations)

  if (groups.length === 0) {
    return <p className="text-pretty text-muted-foreground">{t('empty')}</p>
  }

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <Section key={group.status} title={t(`groups.${group.status}`)}>
          <ul className="space-y-5">
            {group.invitations.map((invitation) => (
              <li key={invitation.id}>
                {invitation.status === 'pending' ? (
                  <Link href={`/invites/${invitation.id}`} className="group block">
                    <InvitationSummary
                      invitation={invitation}
                      timeZone={timeZone}
                      action={
                        <span className="shrink-0 text-sm underline decoration-1 underline-offset-4 group-hover:text-emphasis">
                          {t('respond')}
                        </span>
                      }
                    />
                  </Link>
                ) : (
                  <InvitationSummary invitation={invitation} timeZone={timeZone} />
                )}
              </li>
            ))}
          </ul>
        </Section>
      ))}
    </div>
  )
}
