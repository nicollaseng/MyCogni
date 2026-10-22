'use client'

import {
  answerValues,
  instrumentText,
  twoStepScreens,
  type Answer,
  type ScreeningProgress,
  type ScreeningQuestion,
} from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useId } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

interface QuestionStepProps {
  question: ScreeningQuestion
  progress: ScreeningProgress
  selected: Answer | undefined
  saving: boolean
  error: string | null
  onChoose: (value: Answer) => void
  onBack: (() => void) | null
  onRetry: () => void
}

export function QuestionStep({
  question,
  progress,
  selected,
  saving,
  error,
  onChoose,
  onBack,
  onRetry,
}: QuestionStepProps) {
  const t = useTranslations('screening.questionnaire')
  const questionId = useId()
  const text = instrumentText(useLocale(), twoStepScreens[question.domain].full.id)
  const item = text.items[question.item] ?? ''

  return (
    <section aria-labelledby={questionId} className="flex min-h-0 flex-1 flex-col">
      <div className="mt-6 flex h-8 items-center justify-between text-sm">
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
          {t('progress', { current: progress.current, total: progress.total })}
        </p>
      </div>
      <div aria-hidden className="mt-2 h-[2px] rounded-full bg-rule">
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${String(((progress.current - 1) / progress.total) * 100)}%` }}
        />
      </div>

      <div
        key={`${question.domain}-${String(question.item)}`}
        className="mt-8 animate-rise motion-reduce:animate-none"
      >
        <p className="text-sm font-medium text-muted-foreground">{t('reminder')}</p>
        <h1
          id={questionId}
          className={cn(
            'mt-3 font-serif leading-[1.18] tracking-[-0.015em] text-balance',
            item.length > 110 ? 'text-[22px]' : 'text-[27px]',
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
            {answerValues.map((value) => {
              const chosen = selected === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={chosen}
                  disabled={saving}
                  onClick={() => {
                    onChoose(value)
                  }}
                  className={cn(
                    'flex h-[52px] w-full items-center justify-between rounded-md px-4 text-left text-[17px] transition-colors duration-150 motion-reduce:transition-none',
                    chosen ? 'bg-primary text-primary-foreground' : 'bg-surface active:bg-sage',
                  )}
                >
                  <span>{text.options[value]}</span>
                  <span
                    aria-hidden
                    className={cn(
                      'size-[18px] rounded-full border-[1.5px] transition-colors duration-150',
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
      </div>
    </section>
  )
}
