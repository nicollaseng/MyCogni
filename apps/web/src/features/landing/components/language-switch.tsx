import type { Locale } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { LocaleSelect } from '@/features/locale/components/locale-select'

export function LanguageSwitch({ choose }: { choose: (locale: Locale) => Promise<void> }) {
  const t = useTranslations('common.language')

  return (
    <div
      title={t('label')}
      className="relative grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground has-[select:disabled]:opacity-60 has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-2 has-[select:focus-visible]:outline-foreground"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="size-5"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9s1.2-6.5 3.6-9Z" />
      </svg>
      <LocaleSelect
        choose={choose}
        className="absolute inset-0 [&_select]:size-full [&_select]:min-h-0 [&_select]:opacity-0!"
      />
    </div>
  )
}
