import type { CareLink } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Panel, Section } from '@/shared/components/section'
import type { ActionResult } from '@/shared/lib/actions/result'
import { formatDay } from '../format-day'
import { EndCareLink } from './end-care-link'

const footLink = 'underline decoration-1 underline-offset-4'

interface CareLinksProps {
  links: readonly CareLink[]
  timeZone: string
  end: (id: string) => Promise<ActionResult<null>>
  isProfessional: boolean
}

export function CareLinks({ links, timeZone, end, isProfessional }: CareLinksProps) {
  const t = useTranslations('care.links')
  const kinds = useTranslations('common.professionalKinds')
  const locale = useLocale()

  return (
    <div id="professionals" className="scroll-mt-8">
      <Section title={t('title')}>
        <Panel>
          {links.length === 0 ? (
            <p className="py-3.5 text-muted-foreground">{t('empty')}</p>
          ) : (
            <ul>
              {links.map((link) => (
                <li key={link.id} className="space-y-2 py-3.5">
                  <div className="space-y-0.5">
                    <p>{link.professional.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {kinds(link.professional.kind)} ·{' '}
                      {t('since', {
                        date: formatDay(link.startedAt, timeZone, locale),
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t(link.sharesHistory ? 'history.shared' : 'history.fromStart')}
                    </p>
                  </div>
                  <EndCareLink id={link.id} name={link.professional.name} end={end} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <p className="flex flex-wrap gap-x-6 gap-y-2 px-1">
          <Link href="/invites" className={footLink}>
            {t('invites')}
          </Link>
          {isProfessional && (
            <Link href="/pro" className={footLink}>
              {t('professionalArea')}
            </Link>
          )}
        </p>
      </Section>
    </div>
  )
}
