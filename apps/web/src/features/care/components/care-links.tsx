import type { CareLink } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Panel, Section } from '@/shared/components/section'
import type { ActionResult } from '@/shared/lib/actions/result'
import { termsReviewHref } from '../terms'
import { EndCareLink } from './end-care-link'
import { LinkedProfessional } from './linked-professional'

const footLink = 'underline decoration-1 underline-offset-4'

interface CareLinksProps {
  links: readonly CareLink[]
  timeZone: string
  end: (id: string) => Promise<ActionResult<null>>
  isProfessional: boolean
}

export function CareLinks({ links, timeZone, end, isProfessional }: CareLinksProps) {
  const t = useTranslations('care')

  return (
    <div id="professionals" className="scroll-mt-8">
      <Section title={t('links.title')}>
        <Panel>
          {links.length === 0 ? (
            <p className="py-3.5 text-muted-foreground">{t('links.empty')}</p>
          ) : (
            <ul>
              {links.map((link) => (
                <li key={link.id} className="py-3.5">
                  <LinkedProfessional link={link} timeZone={timeZone}>
                    {link.termsOutdated && (
                      <p>
                        <Link
                          href={termsReviewHref(link.id)}
                          className="inline-flex items-center gap-2 text-sm underline decoration-1 underline-offset-4"
                        >
                          <span
                            aria-hidden
                            className="size-1.5 shrink-0 rounded-full bg-emphasis"
                          />
                          {t('terms.status')}
                        </Link>
                      </p>
                    )}
                    <EndCareLink id={link.id} name={link.professional.name} end={end} />
                  </LinkedProfessional>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/invites" className={footLink}>
            {t('links.invites')}
          </Link>
          {isProfessional && (
            <Link href="/pro" className={footLink}>
              {t('links.professionalArea')}
            </Link>
          )}
        </p>
      </Section>
    </div>
  )
}
