import type { SuggestionReason } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Disclosure } from '@/shared/components/disclosure'

export function WhySuggestion({ reasons }: { reasons: readonly SuggestionReason[] }) {
  const t = useTranslations('zen.why')

  return (
    <Disclosure
      buttonClassName="min-h-10 text-sm text-muted-foreground hover:text-foreground"
      panelClassName="pt-2"
      summary={<span className="underline decoration-1 underline-offset-4">{t('title')}</span>}
    >
      <div className="max-w-[36rem] space-y-3 text-sm leading-relaxed">
        <ul className="list-disc space-y-1.5 pl-5">
          {reasons.map((reason) => (
            <li key={reason}>{t(`reasons.${reason}`)}</li>
          ))}
        </ul>
        <p className="text-muted-foreground">{t('rules')}</p>
        <Link
          href="/questionnaires"
          className="inline-block underline decoration-1 underline-offset-4"
        >
          {t('retake')}
        </Link>
      </div>
    </Disclosure>
  )
}
