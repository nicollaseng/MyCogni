'use client'

import type { CreateCheckInInput } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  moodColor,
  moodKeyOf,
  neutralMood,
  valenceOf,
  type MoodLevel,
} from '@/features/mood/mood-levels'
import { useAutoGrow } from '@/shared/hooks/use-auto-grow'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { formatTime } from '@/shared/lib/time'
import { cn } from '@/shared/lib/utils'
import type { SafetyPrompt } from '@/features/safety/model'
import type { SavedCheckIn } from '../actions'
import { contextTabs } from '../catalog'
import { emotionTabs } from '../suggestions'
import { useCatalogLabels } from '../use-catalog-labels'
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
  save: (input: CreateCheckInInput) => Promise<ActionResult<SavedCheckIn>>
}

export function CheckInFlow({ today, timeZone, save }: CheckInFlowProps) {
  const t = useTranslations('checkIn')
  const tMood = useTranslations('common.mood')
  const locale = useLocale()
  const labels = useCatalogLabels()
  const [step, setStep] = useState<Step>('mood')
  const [level, setLevel] = useState<MoodLevel>(neutralMood)
  const [emotions, setEmotions] = useState<string[]>([])
  const [contexts, setContexts] = useState<string[]>([])
  const [note, setNote] = useState('')
  const noteField = useAutoGrow(note)
  const [recordedAt, setRecordedAt] = useState('')
  const [safety, setSafety] = useState<SafetyPrompt | null>(null)
  const valence = valenceOf(level)
  const progress = step === 'done' ? progressSteps.length : progressSteps.indexOf(step) + 1
  const { submit, pending, error } = useSubmit(save, (saved) => {
    setRecordedAt(formatTime(new Date(saved.checkIn.recordedAt), timeZone, locale))
    setSafety(saved.safety)
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
            {t('flow.back')}
          </button>
          <p className="sr-only">
            {t('flow.progress', { current: progress, total: progressSteps.length })}
          </p>
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
            {t('flow.close')}
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
            title={t('emotionStep.title')}
            valence={valence}
            tabs={labels.emotionChoices(emotionTabs(valence))}
            selected={emotions}
            onToggle={(item) => {
              setEmotions((current) => toggle(current, item))
            }}
            searchLabel={t('emotionStep.search')}
            primaryLabel={
              emotions.length > 0
                ? t('flow.continueWith', { count: emotions.length })
                : t('flow.continue')
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
            title={t('contextStep.title')}
            valence={valence}
            tabs={labels.contextChoices(contextTabs)}
            selected={contexts}
            onToggle={(item) => {
              setContexts((current) => toggle(current, item))
            }}
            searchLabel={t('contextStep.search')}
            primaryLabel={pending ? t('flow.saving') : t('flow.save')}
            onPrimary={finish}
            pending={pending}
            error={error}
          >
            <textarea
              ref={noteField}
              value={note}
              onChange={(event) => {
                setNote(event.currentTarget.value)
              }}
              aria-label={t('contextStep.noteLabel')}
              placeholder={t('contextStep.notePlaceholder')}
              rows={3}
              className="mt-2 max-h-[50dvh] min-h-[4.75rem] w-full resize-none overflow-y-auto bg-transparent font-serif text-[17px] leading-normal outline-none placeholder:text-muted-foreground placeholder:italic"
            />
          </PickerStep>
        )}

        {step === 'done' && (
          <DoneStep
            valence={valence}
            recordedAt={recordedAt}
            safety={safety}
            summary={[
              tMood(moodKeyOf(level)).toLocaleLowerCase(locale),
              ...emotions.map(labels.emotion),
              ...contexts.map(labels.context),
            ]}
          />
        )}
      </div>
    </div>
  )
}
