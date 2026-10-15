import type { PatientInsightContent } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'

interface ReadingContentProps {
  content: PatientInsightContent
  prominent?: boolean
  headingLevel?: 3 | 4
}

export function ReadingContent({
  content,
  prominent = false,
  headingLevel = 3,
}: ReadingContentProps) {
  const t = useTranslations('insights.patient')
  const Heading = headingLevel === 3 ? 'h3' : 'h4'

  return (
    <div className="space-y-7">
      <p
        className={cn(
          'max-w-[38rem] font-serif text-pretty',
          prominent ? 'text-[20px] leading-[1.55] sm:text-[21px]' : 'text-[17px] leading-relaxed',
        )}
      >
        {content.summary}
      </p>
      {content.highlights.length > 0 && (
        <div className="space-y-3">
          <Heading className="text-sm text-muted-foreground">{t('highlights')}</Heading>
          <ul className="max-w-[38rem] space-y-2.5">
            {content.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-3 leading-relaxed text-pretty">
                <span
                  aria-hidden
                  className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-emphasis"
                />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {content.suggestions.length > 0 && (
        <div className="space-y-3">
          <Heading className="text-sm text-muted-foreground">{t('suggestions')}</Heading>
          <ol className="max-w-[38rem] space-y-4">
            {content.suggestions.map((suggestion) => (
              <li key={suggestion.title} className="space-y-1">
                <p className="font-medium">{suggestion.title}</p>
                <p className="leading-relaxed text-pretty text-muted-foreground">
                  {suggestion.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
