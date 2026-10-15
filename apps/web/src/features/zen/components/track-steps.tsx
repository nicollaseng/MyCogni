'use client'

import { type StepText, type TrackId, type TrackStep } from '@mycogni/domain'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, type ReactNode } from 'react'
import { browserPageClient, type PageClient } from '@/features/mybook/page-client'
import { ActionError } from '@/shared/components/action-error'
import { Sheet } from '@/shared/components/sheet'
import { useSubmit } from '@/shared/hooks/use-submit'
import { reportOutdatedApp } from '@/shared/lib/actions/outdated'
import { failure, type ActionResult } from '@/shared/lib/actions/result'
import { cn } from '@/shared/lib/utils'
import { Button, buttonVariants } from '@/shared/ui/button'
import { promptPage } from '../prompt-page'
import { BreathingExercise } from './breathing-exercise'
import { StepToggle, type SaveStep } from './step-toggle'

export type PromptPages = Pick<PageClient, 'create' | 'save'>

export interface StepView {
  step: TrackStep
  text: StepText
  done: boolean
}

interface TrackStepsProps {
  trackId: TrackId
  steps: readonly StepView[]
  nextId: string | null
  support: ReactNode
  save: SaveStep
  pages?: PromptPages
}

function actionVariant(primary: boolean) {
  return primary ? 'default' : 'outline'
}

function BreatheAction({ primary }: { primary: boolean }) {
  const t = useTranslations('zen')
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="sm"
        variant={actionVariant(primary)}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true)
        }}
      >
        {t('track.actions.breathe')}
      </Button>
      {open && (
        <Sheet
          title={t('breathing.title')}
          closeLabel={t('breathing.close')}
          onClose={() => {
            setOpen(false)
          }}
        >
          {() => (
            <div className="overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6">
              <BreathingExercise />
            </div>
          )}
        </Sheet>
      )}
    </>
  )
}

function WriteAction({
  prompt,
  pages,
  primary,
}: {
  prompt: string
  pages: PromptPages
  primary: boolean
}) {
  const t = useTranslations('zen.track')
  const router = useRouter()
  const { submit, pending, error } = useSubmit(
    async (): Promise<ActionResult<string> | null> => {
      const created = await pages.create()
      if (created.kind !== 'created') {
        return outcomeOf(created.kind, t('writeError'))
      }
      const saved = await pages.save(created.id, promptPage(prompt))
      return saved.kind === 'saved'
        ? { ok: true, value: created.id }
        : outcomeOf(saved.kind, t('writeError'))
    },
    (id) => {
      router.push(`/mybook/${id}`)
    },
  )

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        variant={actionVariant(primary)}
        disabled={pending}
        onClick={() => {
          submit()
        }}
      >
        {pending ? t('opening') : t('actions.write')}
      </Button>
      <ActionError error={error} />
    </div>
  )
}

function outcomeOf(kind: 'failed' | 'outdated', error: string): ActionResult<never> | null {
  if (kind === 'outdated') {
    reportOutdatedApp()
    return null
  }
  return failure(error)
}

function StepAction({
  step,
  text,
  pages,
  primary,
}: {
  step: TrackStep
  text: StepText
  pages: PromptPages
  primary: boolean
}) {
  const t = useTranslations('zen.track')
  const linkAction = buttonVariants({ size: 'sm', variant: actionVariant(primary) })

  switch (step.kind) {
    case 'read':
      return (
        <Link href={`/zen/articles/${step.article}`} className={linkAction}>
          {t('actions.read')}
        </Link>
      )
    case 'breathe':
      return <BreatheAction primary={primary} />
    case 'write':
      return <WriteAction prompt={text.body} pages={pages} primary={primary} />
    case 'check_in':
      return (
        <Link href="/check-in" className={linkAction}>
          {t('actions.check_in')}
        </Link>
      )
    case 'questionnaire':
      return (
        <Link href="/questionnaires" className={linkAction}>
          {t('actions.questionnaire')}
        </Link>
      )
    case 'reflect':
    case 'support':
      return null
  }
}

export function TrackSteps({
  trackId,
  steps,
  nextId,
  support,
  save,
  pages = browserPageClient,
}: TrackStepsProps) {
  const t = useTranslations('zen.track')

  return (
    <ol className="space-y-3">
      {steps.map(({ step, text, done }, index) => {
        const titleId = `step-${step.id}`
        return (
          <li
            key={step.id}
            aria-labelledby={titleId}
            className={cn(
              'space-y-2.5 rounded-lg px-5 py-5 transition-colors duration-200 motion-reduce:transition-none sm:px-6',
              step.id === nextId ? 'bg-surface' : 'bg-transparent',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="pt-2 text-sm text-muted-foreground">
                {t('step', { number: index + 1 })}
              </p>
              <StepToggle
                step={{ trackId, stepId: step.id }}
                done={done}
                describedBy={titleId}
                save={save}
              />
            </div>
            <h2
              id={titleId}
              className="font-serif text-[23px] leading-tight tracking-[-0.01em] text-balance"
            >
              {text.title}
            </h2>
            {step.kind === 'write' || step.kind === 'reflect' ? (
              <blockquote className="border-l-2 border-rule pl-4 font-serif text-[18px] leading-relaxed text-pretty italic">
                {text.body}
              </blockquote>
            ) : (
              <p className="leading-relaxed text-pretty text-muted-foreground">{text.body}</p>
            )}
            {step.kind === 'reflect' && (
              <p className="text-sm text-muted-foreground">{t('reflectHint')}</p>
            )}
            {step.kind === 'support' && support}
            <div className="pt-1 empty:hidden">
              <StepAction step={step} text={text} pages={pages} primary={step.id === nextId} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}
