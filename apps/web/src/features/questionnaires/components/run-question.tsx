'use client'

import type { QuestionnaireContent } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

interface RunQuestionProps {
  content: QuestionnaireContent
  index: number
  selected: number | null
  saving: boolean
  error: string | null
  onChoose: (value: number) => void
  onBack: (() => void) | null
  onRetry: () => void
}

export function RunQuestion({
  content,
  index,
  selected,
  saving,
  error,
  onChoose,
  onBack,
  onRetry,
}: RunQuestionProps) {
  const t = useTranslations('questionnaires.question')
  const questionId = useId()
  const total = content.items.length
  const item = content.items[index] ?? ''
  const stem = content.standaloneItems.includes(index) ? null : content.stem

  return (
    <section aria-labelledby={questionId} className="flex min-h-0 flex-1 flex-col">
      <div className="mt-4 flex h-8 items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            onBack?.()
          }}
          disabled={saving}
          className={cn(onBack === null && 'invisible')}
        >
          {t('back')}
        </button>
        <p className="text-muted-foreground tabular-nums">
          {t('progress', { current: index + 1, total })}
        </p>
      </div>
      <div aria-hidden className="mt-2 h-[2px] rounded-full bg-rule">
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${String((index / total) * 100)}%` }}
        />
      </div>

      <div key={index} className="mt-7 animate-rise motion-reduce:animate-none">
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{content.lead}</p>
        {stem !== null && <p className="mt-4 text-[15px] text-muted-foreground">{stem}</p>}
        <h1
          id={questionId}
          className={cn(
            'font-serif leading-[1.18] tracking-[-0.015em] text-balance',
            stem === null ? 'mt-4' : 'mt-1.5',
            item.length > 110 ? 'text-[22px]' : 'text-[26px]',
          )}
        >
          {item}
        </h1>
      </div>

      <div className="mt-auto pt-6 pb-[calc(1.375rem+env(safe-area-inset-bottom))]">
        {saving && (
          <p role="status" className="mb-3 text-sm text-muted-foreground">
            {t('saving')}
          </p>
        )}
        <ActionError error={error} />
        {error !== null ? (
          <Button size="lg" className="w-full" onClick={onRetry}>
            {t('retry')}
          </Button>
        ) : (
          <div role="group" aria-labelledby={questionId} className="space-y-2">
            {content.options.map((option) => {
              const chosen = selected === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={chosen}
                  disabled={saving}
                  onClick={() => {
                    onChoose(option.value)
                  }}
                  className={cn(
                    'flex min-h-[52px] w-full items-center justify-between gap-4 rounded-md px-4 py-3 text-left text-[17px] leading-snug transition-colors duration-150 motion-reduce:transition-none',
                    chosen ? 'bg-primary text-primary-foreground' : 'bg-surface active:bg-sage',
                  )}
                >
                  <span>{option.label}</span>
                  <span
                    aria-hidden
                    className={cn(
                      'size-[18px] shrink-0 rounded-full border-[1.5px] transition-colors duration-150',
                      chosen
                        ? 'border-primary-foreground bg-primary-foreground'
                        : 'border-foreground/30',
                    )}
                  />
                </button>
              )
            })}
          </div>
        )}
        {content.notice !== null && (
          <p className="mt-4 text-center text-[12px] text-muted-foreground">{content.notice}</p>
        )}
      </div>
    </section>
  )
}
