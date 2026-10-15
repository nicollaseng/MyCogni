import type { Consent } from '@mycogni/contracts'
import { consentKinds, isRevocable, type ConsentKind } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { formatLongDate } from '@/shared/lib/time'
import { ConsentSwitch, type SetConsent } from './consent-switch'

const documents: Partial<Record<ConsentKind, '/terms' | '/privacy'>> = {
  terms: '/terms',
  privacy: '/privacy',
}

interface ConsentListProps {
  consents: readonly Consent[]
  timeZone: string
  setConsent: SetConsent
}

export function ConsentList({ consents, timeZone, setConsent }: ConsentListProps) {
  const t = useTranslations('account.consents')
  const locale = useLocale()
  return (
    <ul>
      {consentKinds.map((kind) => {
        const consent = consents.find((item) => item.kind === kind)
        const document = documents[kind]
        const label = t(`kinds.${kind}`)
        return (
          <li key={kind} className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <p>
                {document === undefined ? (
                  label
                ) : (
                  <Link href={document} className="underline decoration-1 underline-offset-4">
                    {label}
                  </Link>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {consent === undefined
                  ? t('notGranted')
                  : t('granted', {
                      date: formatLongDate(new Date(consent.grantedAt), timeZone, locale),
                    })}
              </p>
            </div>
            {isRevocable(kind) && (
              <ConsentSwitch kind={kind} enabled={consent !== undefined} setConsent={setConsent} />
            )}
          </li>
        )
      })}
    </ul>
  )
}
