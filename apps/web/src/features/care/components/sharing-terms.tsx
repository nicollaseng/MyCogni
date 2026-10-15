import { sharingConsentVersion } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Section } from '@/shared/components/section'

export function SharingTerms({ name }: { name: string }) {
  const t = useTranslations('care.accept.terms')

  return (
    <Section title={t('title')}>
      <div className="max-w-xl space-y-3 text-[15px] leading-relaxed text-pretty">
        <p className="text-sm text-muted-foreground">
          {t('version', { version: sharingConsentVersion })}
        </p>
        <p>{t('purpose', { name })}</p>
        <p>{t('history')}</p>
        <p>{t('end', { name })}</p>
        <p>
          {t.rich('privacy', {
            link: (chunks) => (
              <Link
                href="/privacy"
                target="_blank"
                className="underline decoration-1 underline-offset-4"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
        <p className="text-muted-foreground">{t('agreement')}</p>
      </div>
    </Section>
  )
}
