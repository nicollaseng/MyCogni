'use client'

import type { CheckIn, CreateCheckInInput } from '@mycogni/contracts'
import Link from 'next/link'
import { useState } from 'react'
import {
  labelOf,
  moodColor,
  neutralMood,
  valenceOf,
  type MoodLevel,
} from '@/features/mood/mood-levels'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { formatTime } from '@/shared/lib/time'
import { cn } from '@/shared/lib/utils'
import { contextTabs } from '../catalog'
import { emotionTabs } from '../suggestions'
import { DoneStep } from './done-step'
import { MoodStep } from './mood-step'
import { PickerStep } from './picker-step'

type Step = 'mood' | 'emotions' | 'context' | 'done'

const progressSteps: readonly Step[] = ['mood', 'emotions', 'context']

function toggle(list: readonly string[], item: string): string[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item]
}

interface CheckInFlowProps {
  today: string
  timeZone: string
  save: (input: CreateCheckInInput) => Promise<ActionResult<CheckIn>>
}

export function CheckInFlow({ today, timeZone, save }: CheckInFlowProps) {
  const [step, setStep] = useState<Step>('mood')
  const [level, setLevel] = useState<MoodLevel>(neutralMood)
  const [emotions, setEmotions] = useState<string[]>([])
  const [contexts, setContexts] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [recordedAt, setRecordedAt] = useState('')
  const valence = valenceOf(level)
  const progress = step === 'done' ? progressSteps.length : progressSteps.indexOf(step) + 1
  const { submit, pending, error } = useSubmit(save, (checkIn) => {
    setRecordedAt(formatTime(new Date(checkIn.recordedAt), timeZone))
    setStep('done')
  })

  function finish() {
    submit({ moodLevel: level, emotions, contexts, note: note.trim() === '' ? null : note })
  }

  return (
    <div
      className="flex h-dvh flex-col transition-colors duration-700 motion-reduce:transition-none"
      style={{
        backgroundColor: `color-mix(in oklab, ${moodColor(valence)} 9%, var(--background))`,
      }}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[460px] flex-1 flex-col px-6 pt-5">
        <header className="flex h-11 shrink-0 items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStep(step === 'context' ? 'emotions' : 'mood')
            }}
            className={cn(
              'min-w-14 text-left',
              (step === 'mood' || step === 'done') && 'invisible',
            )}
          >
            Voltar
          </button>
          <p className="sr-only">{`Passo ${String(progress)} de ${String(progressSteps.length)}`}</p>
          <div aria-hidden className="flex gap-1.5">
            {progressSteps.map((item, index) => (
              <span
                key={item}
                className={cn(
                  'h-[3px] w-[18px] rounded-full transition-colors',
                  index < progress ? 'bg-foreground' : 'bg-rule',
                )}
              />
            ))}
          </div>
          <Link href="/today" className="min-w-14 text-right">
            Fechar
          </Link>
        </header>

        {step === 'mood' && (
          <MoodStep
            today={today}
            level={level}
            onChange={setLevel}
            onContinue={() => {
              setStep('emotions')
            }}
            onFinish={finish}
            pending={pending}
            error={error}
          />
        )}

        {step === 'emotions' && (
          <PickerStep
            title="O que você está sentindo?"
            valence={valence}
            tabs={emotionTabs(valence)}
            selected={emotions}
            onToggle={(item) => {
              setEmotions((current) => toggle(current, item))
            }}
            searchLabel="Buscar ou escrever outra"
            primaryLabel={
              emotions.length > 0 ? `Continuar com ${String(emotions.length)}` : 'Continuar'
            }
            onPrimary={() => {
              setStep('context')
            }}
            onSkip={() => {
              setStep('context')
            }}
          />
        )}

        {step === 'context' && (
          <PickerStep
            title="O que tem a ver com isso?"
            valence={valence}
            tabs={contextTabs}
            selected={contexts}
            onToggle={(item) => {
              setContexts((current) => toggle(current, item))
            }}
            searchLabel="Buscar ou escrever outro"
            primaryLabel={pending ? 'Registrando…' : 'Registrar'}
            onPrimary={finish}
            pending={pending}
            error={error}
          >
            <textarea
              value={note}
              onChange={(event) => {
                setNote(event.currentTarget.value)
              }}
              aria-label="Nota sobre hoje"
              placeholder="Quer anotar algo sobre hoje?"
              rows={2}
              className="mt-2 w-full resize-none bg-transparent font-serif text-[17px] leading-normal outline-none placeholder:text-muted-foreground placeholder:italic"
            />
          </PickerStep>
        )}

        {step === 'done' && (
          <DoneStep
            valence={valence}
            recordedAt={recordedAt}
            summary={[labelOf(level).toLowerCase(), ...emotions, ...contexts]}
          />
        )}
      </div>
    </div>
  )
}
