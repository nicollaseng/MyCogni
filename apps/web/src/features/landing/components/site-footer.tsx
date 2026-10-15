import { crisisLinesFor } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Wordmark } from '@/shared/components/wordmark'
import { sectionKeys, sections } from '../content'

const linkStyles = 'text-muted-foreground transition-colors hover:text-foreground'

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-medium">{title}</h2>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  )
}

export function SiteFooter() {
  const t = useTranslations('landing')
  const legal = useTranslations('legal')
  const crisisLines = crisisLinesFor(useLocale())
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-rule py-14 text-sm">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-xs leading-relaxed text-muted-foreground">{t('footer.tagline')}</p>
        </div>
        <FooterColumn title={t('footer.product')}>
          {sectionKeys.map((key) => (
            <li key={key}>
              <a href={`/#${sections[key]}`} className={linkStyles}>
                {t(`sections.${key}`)}
              </a>
            </li>
          ))}
        </FooterColumn>
        <FooterColumn title={t('footer.help')}>
          {crisisLines.map((line) => (
            <li key={line.phone} className="leading-relaxed">
              <a href={`tel:${line.phone}`} className="font-medium hover:underline">
                {line.display}
              </a>{' '}
              <span className="text-muted-foreground">{line.description}</span>
            </li>
          ))}
        </FooterColumn>
        <FooterColumn title={t('footer.legal')}>
          <li>
            <Link href="/terms" className={linkStyles}>
              {legal('terms.title')}
            </Link>
          </li>
          <li>
            <Link href="/privacy" className={linkStyles}>
              {legal('privacy.title')}
            </Link>
          </li>
          <li>
            <Link href="/pro/join" className={linkStyles}>
              {t('footer.professionals')}
            </Link>
          </li>
        </FooterColumn>
      </div>
      <div className="mt-12 flex flex-col gap-2 border-t border-rule pt-6 text-muted-foreground sm:flex-row sm:justify-between">
        <p>{t('footer.copyright', { year })}</p>
        <p>{t('footer.disclaimer')}</p>
      </div>
    </footer>
  )
}
