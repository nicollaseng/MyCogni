'use client'

import type { Assessment } from '@mycogni/contracts'
import { answerValues, instrumentText, type Instrument } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import type { SubmitScreening } from '../model'
import { useSubmit } from '@/shared/hooks/use-submit'
import { ActionError } from '@/shared/components/action-error'

const advanceDelay = 220

function isAnswered(value: number | null): value is number {
  return value !== null
}

interface QuestionnaireProps {
  instrument: Instrument
  send: SubmitScreening
  onDone: (assessment: Assessment) => void
}

export function Questionnaire({ instrument, send, onDone }: QuestionnaireProps) {
  const t = useTranslations('screening.questionnaire')
  const text = instrumentText(useLocale(), instrument.id)
  const total = instrument.itemCount
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<readonly (number | null)[]>(() =>
    Array.from({ length: total }, () => null),
  )
  const [advancing, setAdvancing] = useState(false)
  const { submit, pending, error } = useSubmit(send, onDone)
  const item = text.items[index] ?? ''
  const answered = answers.filter(isAnswered)
  const complete = answered.length === total

  function sendAnswers() {
    submit({ instrument: instrument.id, answers: answered })
  }

  function choose(value: number) {
    if (advancing || pending) {
      return
    }
    const next = answers.with(index, value)
    setAnswers(next)
    if (index === total - 1) {
      submit({ instrument: instrument.id, answers: next.filter(isAnswered) })
      return
    }
    setAdvancing(true)
    window.setTimeout(() => {
      setIndex(index + 1)
      setAdvancing(false)
    }, advanceDelay)
  }

  return (
    <section aria-labelledby="question" className="flex min-h-0 flex-1 flex-col">
      <div className="mt-6 flex h-8 items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setIndex(index - 1)
          }}
          disabled={pending}
          className={cn(index === 0 && 'invisible')}
        >
          {t('back')}
        </button>
        <p className="text-muted-foreground">
          {t('progress', { name: instrument.name, current: index + 1, total })}
        </p>
      </div>
      <div aria-hidden className="mt-2 h-[2px] rounded-full bg-rule">
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${String((answered.length / total) * 100)}%` }}
        />
      </div>

      <div key={index} className="mt-8 animate-rise motion-reduce:animate-none">
        <p className="text-[15px] leading-relaxed text-muted-foreground">{text.prompt}</p>
        <h1
          id="question"
          className={cn(
            'mt-4 font-serif leading-[1.18] tracking-[-0.015em] text-balance',
            item.length > 110 ? 'text-[22px]' : 'text-[27px]',
          )}
        >
          {item}
        </h1>
      </div>

      <div className="mt-auto pt-6 pb-[calc(1.375rem+env(safe-area-inset-bottom))]">
        {pending && (
          <p role="status" className="mb-3 text-sm text-muted-foreground">
            {t('saving')}
          </p>
        )}
        <ActionError error={error} />
        {error !== null && complete ? (
          <Button size="lg" className="w-full" onClick={sendAnswers}>
            {t('retry')}
          </Button>
        ) : (
          <div role="group" aria-labelledby="question" className="space-y-2">
            {answerValues.map((value) => {
              const selected = answers[index] === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    choose(value)
                  }}
                  className={cn(
                    'flex h-[52px] w-full items-center justify-between rounded-md px-4 text-left text-[17px] transition-colors duration-150 motion-reduce:transition-none',
                    selected ? 'bg-primary text-primary-foreground' : 'bg-surface active:bg-sage',
                  )}
                >
                  <span>{text.options[value]}</span>
                  <span
                    aria-hidden
                    className={cn(
                      'size-[18px] rounded-full border-[1.5px] transition-colors duration-150',
                      selected
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
