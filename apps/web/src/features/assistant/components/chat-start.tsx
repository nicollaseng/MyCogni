import { useTranslations } from 'next-intl'
import type { AssistantTarget } from '../model'

interface ChatStartProps {
  mode: AssistantTarget['mode']
  page: boolean
  onAsk: (text: string) => void
}

const personalStarters = ['mood', 'helps', 'sleep'] as const

const professionalStarters = ['trend', 'contexts', 'screenings'] as const

const pageStarters = ['continue', 'feeling', 'summary'] as const

export function ChatStart({ mode, page, onAsk }: ChatStartProps) {
  const t = useTranslations('assistant')

  if (page) {
    return (
      <ul aria-label={t('page.suggestions')} className="flex flex-wrap gap-2">
        {pageStarters.map((key) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => {
                onAsk(t(`page.starters.${key}`))
              }}
              className="rounded-[6px] border border-rule px-3 py-2 text-left text-[15px] transition-colors hover:bg-surface"
            >
              {t(`page.starters.${key}`)}
            </button>
          </li>
        ))}
      </ul>
    )
  }

  const starters =
    mode === 'personal'
      ? personalStarters.map((key) => t(`starters.personal.${key}`))
      : professionalStarters.map((key) => t(`starters.professional.${key}`))

  return (
    <div className="space-y-3">
      <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
        {t(`empty.${mode}`)}
      </p>
      <ul className="space-y-2">
        {starters.map((starter) => (
          <li key={starter}>
            <button
              type="button"
              onClick={() => {
                onAsk(starter)
              }}
              className="w-full rounded-[6px] border border-rule px-3.5 py-2.5 text-left text-[15px] transition-colors hover:bg-surface"
            >
              {starter}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
