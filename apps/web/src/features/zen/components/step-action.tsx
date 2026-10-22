'use client'

import type { StepText, TrackStep } from '@mycogni/domain'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { browserPageClient, type PageClient } from '@/features/mybook/page-client'
import { ActionError } from '@/shared/components/action-error'
import { useSubmit } from '@/shared/hooks/use-submit'
import { reportOutdatedApp } from '@/shared/lib/actions/outdated'
import { failure, type ActionResult } from '@/shared/lib/actions/result'
import { Button, buttonVariants } from '@/shared/ui/button'
import { MeditationButton } from '../meditation/meditation-button'
import type { MeditationOption } from '../meditation/options'
import { promptPage } from '../prompt-page'
import { BreatheButton } from './breathe-button'

export type PromptPages = Pick<PageClient, 'create' | 'save'>

type ActionVariant = 'default' | 'outline' | 'inverse'

interface StepActionProps {
  step: TrackStep
  text: StepText
  primary: boolean
  label?: string
  pages?: PromptPages
  inverse?: boolean
  meditation?: MeditationOption | null
}

function outcomeOf(kind: 'failed' | 'outdated', error: string): ActionResult<never> | null {
  if (kind === 'outdated') {
    reportOutdatedApp()
    return null
  }
  return failure(error)
}

function WriteAction({
  prompt,
  pages,
  variant,
  label,
}: {
  prompt: string
  pages: PromptPages
  variant: ActionVariant
  label: string
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
        variant={variant}
        size={variant === 'outline' ? 'sm' : 'default'}
        disabled={pending}
        onClick={() => {
          submit()
        }}
      >
        {pending ? t('opening') : label}
      </Button>
      <ActionError error={error} />
    </div>
  )
}

export function StepAction({
  step,
  text,
  primary,
  label,
  pages = browserPageClient,
  inverse = false,
  meditation = null,
}: StepActionProps) {
  const t = useTranslations('zen.track')
  const size = primary ? 'default' : 'sm'
  const variant: ActionVariant = primary ? (inverse ? 'inverse' : 'default') : 'outline'
  const linkAction = buttonVariants({ size, variant })

  switch (step.kind) {
    case 'read':
      return (
        <Link href={`/zen/articles/${step.article}`} className={linkAction}>
          {label ?? t('actions.read')}
        </Link>
      )
    case 'breathe':
      return <BreatheButton label={label ?? t('actions.breathe')} variant={variant} size={size} />
    case 'write':
      return (
        <WriteAction
          prompt={text.body}
          pages={pages}
          variant={variant}
          label={label ?? t('actions.write')}
        />
      )
    case 'check_in':
      return (
        <Link href="/check-in" className={linkAction}>
          {label ?? t('actions.check_in')}
        </Link>
      )
    case 'questionnaire':
      return (
        <Link href="/questionnaires" className={linkAction}>
          {label ?? t('actions.questionnaire')}
        </Link>
      )
    case 'meditate':
      return meditation === null ? null : (
        <MeditationButton
          option={meditation}
          label={label ?? t('actions.meditate')}
          variant={variant}
          size={size}
        />
      )
    case 'reflect':
    case 'support':
      return null
  }
}
