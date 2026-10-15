import type { Locale } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Wordmark } from '@/shared/components/wordmark'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'
import { sectionKeys, sections } from '../content'
import { LanguageSwitch } from './language-switch'

export function SiteHeader({ chooseLocale }: { chooseLocale: (locale: Locale) => Promise<void> }) {
  const t = useTranslations('landing')

  return (
    <header className="flex items-center justify-between gap-6 py-6">
      <Wordmark />
      <nav aria-label={t('sections.label')} className="hidden lg:block">
        <ul className="flex items-center gap-6 text-[15px] whitespace-nowrap text-muted-foreground xl:gap-8">
          {sectionKeys.map((key) => (
            <li key={key}>
              <a href={`/#${sections[key]}`} className="transition-colors hover:text-foreground">
                {t(`sections.${key}`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-3 sm:gap-5">
        <LanguageSwitch choose={chooseLocale} />
        <Link
          href="/sign-in"
          className="text-[15px] whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('cta.signIn')}
        </Link>
        <Link
          href="/sign-up"
          className={cn(buttonVariants({ size: 'sm', shape: 'pill' }), 'hidden sm:inline-flex')}
        >
          {t('cta.signUp')}
        </Link>
      </div>
    </header>
  )
}
