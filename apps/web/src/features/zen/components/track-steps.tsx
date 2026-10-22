'use client'

import type { StepText, TrackId, TrackStep } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useId, useState, type ReactNode } from 'react'
import { NarrationPlayer } from '@/features/audio/components/narration-player'
import type { NarrationSource } from '@/features/audio/narration'
import { Chevron, DisclosurePanel } from '@/shared/components/disclosure'
import { useLocationHash } from '@/shared/hooks/use-location-hash'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import type { MeditationOption } from '../meditation/options'
import { hasStepAction } from '../model'
import { StepAction, type PromptPages } from './step-action'
import { StepToggle, type SaveStep } from './step-toggle'

export type { PromptPages } from './step-action'

export interface StepView {
  step: TrackStep
  title: string
  text: StepText
  done: boolean
  minutes: number
  narration: readonly NarrationSource[]
  meditation?: MeditationOption | null
}

interface TrackStepsProps {
  trackId: TrackId
  steps: readonly StepView[]
  nextId: string | null
  started: boolean
  support: ReactNode
  save: SaveStep
  pages?: PromptPages
}

interface StepRowProps {
  trackId: TrackId
  view: StepView
  open: boolean
  onToggle: () => void
  support: ReactNode
  save: SaveStep
  pages: PromptPages | undefined
}

function StepRow({ trackId, view, open, onToggle, support, save, pages }: StepRowProps) {
  const t = useTranslations('zen')
  const { step, text, done, minutes, narration } = view
  const titleId = `step-${step.id}-title`
  const panelId = useId()
  const prompt = step.kind === 'write' || step.kind === 'reflect'

  return (
    <li id={`step-${step.id}`} aria-labelledby={titleId} className="rounded-lg bg-surface">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex min-h-16 w-full items-center gap-3.5 px-4 py-3 text-left sm:px-5"
      >
        <span
          aria-hidden
          className={cn(
            'size-2.5 shrink-0 rounded-full border-[1.5px]',
            done ? 'border-emphasis bg-emphasis' : 'border-foreground/40',
          )}
        />
        <span className="min-w-0 flex-1">
          <span id={titleId} className="block leading-snug text-pretty">
            {text.title}
          </span>
          <span className="block text-sm text-muted-foreground">
            {t(`kinds.${step.kind}`)} · {t('minutes', { minutes })}
            {done && ` · ${t('track.done')}`}
          </span>
        </span>
        <Chevron open={open} className="text-muted-foreground" />
      </button>
      <DisclosurePanel id={panelId} open={open} className="space-y-4 px-4 pb-5 sm:px-5 sm:pl-11">
        {prompt ? (
          <blockquote className="border-l-2 border-rule pl-4 font-serif text-[18px] leading-relaxed text-pretty italic">
            {text.body}
          </blockquote>
        ) : (
          <p className="leading-relaxed text-pretty text-muted-foreground">{text.body}</p>
        )}
        {step.kind === 'reflect' && (
          <p className="text-sm text-muted-foreground">{t('track.reflectHint')}</p>
        )}
        {step.kind === 'support' && support}
        {narration.length > 0 && <NarrationPlayer sources={narration} title={text.title} compact />}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <StepAction
            step={step}
            text={text}
            primary={false}
            pages={pages}
            meditation={view.meditation ?? null}
          />
          <StepToggle
            step={{ trackId, stepId: step.id }}
            done={done}
            describedBy={titleId}
            save={save}
          />
        </div>
      </DisclosurePanel>
    </li>
  )
}

export function TrackSteps({
  trackId,
  steps,
  nextId,
  started,
  support,
  save,
  pages,
}: TrackStepsProps) {
  const t = useTranslations('zen')
  const hash = useLocationHash()
  const [chosen, setChosen] = useState<string | null>(null)
  const linked = steps.find((view) => hash === `#step-${view.step.id}`)?.step.id ?? null
  const openId = chosen ?? linked
  const next = steps.find((view) => view.step.id === nextId)

  function show(id: string) {
    setChosen(id)
    document.getElementById(`step-${id}`)?.scrollIntoView({ block: 'start' })
  }

  return (
    <div className="space-y-8">
      {next !== undefined && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('track.next', { title: next.title, minutes: next.minutes })}
          </p>
          {hasStepAction(next.step, (next.meditation ?? null) !== null) ? (
            <StepAction
              step={next.step}
              text={next.text}
              primary
              label={started ? t('today.continue') : t('today.start')}
              pages={pages}
              meditation={next.meditation ?? null}
            />
          ) : (
            <Button
              onClick={() => {
                show(next.step.id)
              }}
            >
              {started ? t('today.continue') : t('today.start')}
            </Button>
          )}
        </div>
      )}
      <section aria-labelledby="track-steps" className="space-y-3">
        <h2 id="track-steps" className="text-[15px] font-medium">
          {t('track.steps')}
        </h2>
        <ol className="space-y-2">
          {steps.map((view) => (
            <StepRow
              key={view.step.id}
              trackId={trackId}
              view={view}
              open={openId === view.step.id}
              onToggle={() => {
                setChosen(openId === view.step.id ? '' : view.step.id)
              }}
              support={support}
              save={save}
              pages={pages}
            />
          ))}
        </ol>
      </section>
    </div>
  )
}
