import { maxMoodLevel, type ContextEffect } from '@mycogni/domain'
import { useFormatter, useTranslations } from 'next-intl'
import { useCatalogLabels } from '@/features/check-in/use-catalog-labels'

function position(average: number): string {
  return `${String((average / maxMoodLevel) * 100)}%`
}

function Dumbbell({ effect }: { effect: ContextEffect }) {
  const low = Math.min(effect.withAverage, effect.withoutAverage)
  const high = Math.max(effect.withAverage, effect.withoutAverage)
  return (
    <span aria-hidden className="relative block h-4">
      <span className="absolute inset-x-0 top-1/2 h-px bg-rule" />
      <span
        className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-emphasis/40"
        style={{ left: position(low), width: position(high - low) }}
      />
      <span
        data-mark="without"
        className="absolute top-1/2 size-3 -translate-1/2 rounded-full border-2 border-muted-foreground bg-background"
        style={{ left: position(effect.withoutAverage) }}
      />
      <span
        data-mark="with"
        className="absolute top-1/2 size-3 -translate-1/2 rounded-full bg-emphasis ring-2 ring-background"
        style={{ left: position(effect.withAverage) }}
      />
    </span>
  )
}

export function ContextEffects({ effects }: { effects: readonly ContextEffect[] }) {
  const t = useTranslations('patterns.contexts')
  const format = useFormatter()
  const labels = useCatalogLabels()
  const decimal = (value: number) =>
    format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  return (
    <div className="space-y-5 pt-1">
      <p aria-hidden className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-emphasis" />
          {t('with')}
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full border-2 border-muted-foreground" />
          {t('without')}
        </span>
      </p>
      <ul className="space-y-5">
        {effects.map((effect) => (
          <li key={effect.context} className="space-y-2">
            <p className="leading-relaxed text-pretty">
              {t('sentence', {
                context: labels.context(effect.context),
                with: decimal(effect.withAverage),
                without: decimal(effect.withoutAverage),
              })}{' '}
              <span className="text-sm whitespace-nowrap text-muted-foreground">
                ({t('days', { with: effect.withDays, without: effect.withoutDays })})
              </span>
            </p>
            <Dumbbell effect={effect} />
          </li>
        ))}
      </ul>
    </div>
  )
}
