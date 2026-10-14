'use client'

import type { Assessment } from '@mycogni/contracts'
import { frequencyOptions, type Instrument } from '@mycogni/domain'
import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import type { OnboardingActions } from '../model'
import { useSubmit } from '../use-submit'
import { ActionError } from './action-error'

const advanceDelay = 220

function isAnswered(value: number | null): value is number {
  return value !== null
}

interface QuestionnaireProps {
  instrument: Instrument
  send: OnboardingActions['submitScreening']
  onDone: (assessment: Assessment) => void
}

export function Questionnaire({ instrument, send, onDone }: QuestionnaireProps) {
  const total = instrument.items.length
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<readonly (number | null)[]>(() =>
    instrument.items.map(() => null),
  )
  const [advancing, setAdvancing] = useState(false)
  const { submit, pending, error } = useSubmit(send, onDone)
  const item = instrument.items[index] ?? ''
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
          Voltar
        </button>
        <p className="text-muted-foreground">
          {instrument.name} · {index + 1} de {total}
        </p>
      </div>
      <div aria-hidden className="mt-2 h-[2px] rounded-full bg-rule">
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${String((answered.length / total) * 100)}%` }}
        />
      </div>

      <div key={index} className="mt-8 animate-rise motion-reduce:animate-none">
        <p className="text-[15px] leading-relaxed text-muted-foreground">{instrument.prompt}</p>
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
            Salvando suas respostas…
          </p>
        )}
        <ActionError error={error} />
        {error !== null && complete ? (
          <Button size="lg" shape="pill" className="w-full" onClick={sendAnswers}>
            Tentar de novo
          </Button>
        ) : (
          <div role="group" aria-labelledby="question" className="border-t border-rule">
            {frequencyOptions.map((option) => {
              const selected = answers[index] === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    choose(option.value)
                  }}
                  className="flex h-14 w-full items-center justify-between border-b border-rule text-left text-[17px] transition-colors active:bg-sage/60"
                >
                  <span className={cn(!selected && 'text-foreground/85')}>{option.label}</span>
                  <span
                    aria-hidden
                    className={cn(
                      'size-[18px] rounded-full border-[1.5px] transition-colors duration-150',
                      selected ? 'border-foreground bg-foreground' : 'border-foreground/30',
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
