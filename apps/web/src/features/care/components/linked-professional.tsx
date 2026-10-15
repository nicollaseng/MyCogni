import type { CareLink } from '@mycogni/contracts'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Avatar } from '@/shared/components/avatar'
import { initialsOf } from '@/shared/lib/initials'
import { formatDay } from '../format-day'

interface LinkedProfessionalProps {
  link: CareLink
  timeZone: string
  children?: ReactNode
}

export function LinkedProfessional({ link, timeZone, children }: LinkedProfessionalProps) {
  const t = useTranslations('care.links')
  const kinds = useTranslations('common.professionalKinds')
  const common = useTranslations('common')
  const locale = useLocale()
  const { professional } = link

  return (
    <div className="flex gap-3.5">
      <Avatar
        src={professional.photoUrl}
        initials={initialsOf(professional.name)}
        alt={common('photoOf', { name: professional.name })}
        size="md"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-0.5">
          <p>{professional.name}</p>
          <p className="text-sm text-muted-foreground">
            {kinds(professional.kind)} ·{' '}
            {t('since', { date: formatDay(link.startedAt, timeZone, locale) })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(link.sharesHistory ? 'history.shared' : 'history.fromStart')}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
