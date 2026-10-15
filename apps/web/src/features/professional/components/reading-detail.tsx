import type { ProfessionalInsightContent } from '@mycogni/contracts'
import type { InsightAttention } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'

const attentionStyles: Record<InsightAttention, { dot: string; text: string }> = {
  none: { dot: 'bg-muted-foreground/50', text: 'text-muted-foreground' },
  watch: { dot: 'bg-(--warn)', text: 'font-medium text-(--warn)' },
  urgent: { dot: 'bg-danger', text: 'font-medium text-danger' },
}

export function AttentionLevel({ level }: { level: InsightAttention }) {
  const t = useTranslations('insights.professional.attention')
  const style = attentionStyles[level]
  return (
    <span data-attention={level} className={cn('whitespace-nowrap', style.text)}>
      <span
        aria-hidden
        className={cn('mr-2 inline-block size-2 rounded-full align-middle', style.dot)}
      />
      {t(level)}
    </span>
  )
}

interface PointsProps {
  title: string
  items: readonly string[]
  heading: 'h3' | 'h4'
}

function Points({ title, items, heading: Heading }: PointsProps) {
  const t = useTranslations('insights.professional')
  return (
    <div className="space-y-2">
      <Heading className="text-[13px] text-muted-foreground">{title}</Heading>
      {items.length === 0 ? (
        <p className="text-[15px] text-muted-foreground">{t('nothing')}</p>
      ) : (
        <ul className="space-y-1.5 text-[15px] leading-relaxed">
          {items.map((item) => (
            <li key={item} className="flex gap-2.5 text-pretty">
              <span
                aria-hidden
                className="mt-[0.7em] size-1 shrink-0 rounded-full bg-muted-foreground/70"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface ReadingDetailProps {
  content: ProfessionalInsightContent
  withLevel: boolean
  heading: 'h3' | 'h4'
}

export function ReadingDetail({ content, withLevel, heading }: ReadingDetailProps) {
  const t = useTranslations('insights.professional')
  const reason = content.attentionReason

  return (
    <div className="space-y-5">
      {(withLevel || reason !== null) && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
          {withLevel && <AttentionLevel level={content.attention} />}
          {reason !== null && (
            <p className="max-w-[46rem] text-[15px] leading-relaxed text-pretty">{reason}</p>
          )}
        </div>
      )}
      <p className="max-w-[46rem] font-serif text-[17px] leading-relaxed text-pretty md:text-lg">
        {content.summary}
      </p>
      <div className="grid gap-x-10 gap-y-5 md:grid-cols-2">
        <Points title={t('trends')} items={content.trends} heading={heading} />
        <Points title={t('themes')} items={content.themes} heading={heading} />
      </div>
    </div>
  )
}
