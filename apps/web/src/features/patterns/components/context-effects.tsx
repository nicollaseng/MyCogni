import { maxMoodLevel, type ContextEffect } from '@mycogni/domain'
import { useFormatter, useTranslations } from 'next-intl'
import { useCatalogLabels } from '@/features/check-in/use-catalog-labels'
import { Section } from '@/shared/components/section'

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

function EffectList({ effects }: { effects: readonly ContextEffect[] }) {
  const t = useTranslations('patterns.associations')
  const format = useFormatter()
  const labels = useCatalogLabels()
  const decimal = (value: number) =>
    format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  return (
    <ul className="space-y-4 pt-1">
      {effects.map((effect) => (
        <li key={effect.context} className="space-y-1.5">
          <p className="flex items-baseline justify-between gap-4">
            <span className="truncate">{labels.context(effect.context)}</span>
            <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
              <span aria-hidden className="size-2 rounded-full bg-emphasis" />
              {decimal(effect.withAverage)} {t('with')}
              <span
                aria-hidden
                className="ml-2 size-2 rounded-full border-[1.5px] border-muted-foreground"
              />
              {decimal(effect.withoutAverage)} {t('without')}
              <span className="sr-only">
                {' '}
                ({t('days', { with: effect.withDays, without: effect.withoutDays })})
              </span>
            </span>
          </p>
          <Dumbbell effect={effect} />
        </li>
      ))}
    </ul>
  )
}

interface ContextEffectsProps {
  better: readonly ContextEffect[]
  harder: readonly ContextEffect[]
}

export function ContextEffects({ better, harder }: ContextEffectsProps) {
  const t = useTranslations('patterns.associations')
  const lead = better.length > 0 ? better : harder

  return (
    <Section title={better.length > 0 ? t('better') : t('harder')}>
      <p className="text-sm text-muted-foreground">{t('reading')}</p>
      <EffectList effects={lead} />
      {better.length > 0 && harder.length > 0 && (
        <div className="space-y-1 pt-4">
          <h3 className="text-sm font-medium">{t('harderShort')}</h3>
          <EffectList effects={harder} />
        </div>
      )}
    </Section>
  )
}
