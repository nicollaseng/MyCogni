import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { formatDay } from '../format-day'
import type { ClosedStatus } from '../invitations'

const footLink = 'underline decoration-1 underline-offset-4'

interface InvitationOutcomeProps {
  status: ClosedStatus
  name: string
  date: string
  timeZone: string
}

export function InvitationOutcome({ status, name, date, timeZone }: InvitationOutcomeProps) {
  const t = useTranslations('care.accept')
  const locale = useLocale()

  return (
    <>
      <p className="max-w-xl leading-relaxed text-pretty">
        {t(`closed.${status}`, { name, date: formatDay(date, timeZone, locale) })}
      </p>
      <p className="flex flex-wrap gap-x-6 gap-y-2">
        {status === 'accepted' && (
          <Link href="/me/professionals" className={footLink}>
            {t('seeProfessionals')}
          </Link>
        )}
        <Link href="/invites" className={footLink}>
          {t('back')}
        </Link>
      </p>
    </>
  )
}
