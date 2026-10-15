'use client'

import { requiredConsentKinds, type ConsentKind } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { StepActions } from '@/shared/components/step-actions'
import { Button } from '@/shared/ui/button'
import type { OnboardingActions } from '../model'
import { useSubmit } from '@/shared/hooks/use-submit'
import { ActionError } from '@/shared/components/action-error'
import { StepHeading } from '@/shared/components/step-heading'

type ConsentOptionId = 'adult' | 'documents' | 'health' | 'ai'

interface ConsentOption {
  id: ConsentOptionId
  kinds: readonly ConsentKind[]
}

const documentLink = 'underline decoration-1 underline-offset-4'

const options: readonly ConsentOption[] = [
  { id: 'adult', kinds: ['adult'] },
  { id: 'documents', kinds: ['terms', 'privacy'] },
  { id: 'health', kinds: ['health_data'] },
  { id: 'ai', kinds: ['ai_processing'] },
]

function isRequired(option: ConsentOption): boolean {
  return option.kinds.every((kind) => requiredConsentKinds.includes(kind))
}

function ConsentLabel({ id }: { id: ConsentOptionId }) {
  const t = useTranslations('onboarding.consents')
  if (id !== 'documents') {
    return t(id)
  }
  return t.rich('documents', {
    terms: (chunks) => (
      <Link href="/terms" target="_blank" className={documentLink}>
        {chunks}
      </Link>
    ),
    privacy: (chunks) => (
      <Link href="/privacy" target="_blank" className={documentLink}>
        {chunks}
      </Link>
    ),
  })
}

interface ConsentStepProps {
  accept: OnboardingActions['acceptConsents']
  onDone: () => void
}

export function ConsentStep({ accept, onDone }: ConsentStepProps) {
  const t = useTranslations('onboarding.consents')
  const [checked, setChecked] = useState<readonly string[]>([])
  const { submit, pending, error } = useSubmit(accept, onDone)
  const ready = options.filter(isRequired).every((option) => checked.includes(option.id))

  function toggle(id: string) {
    setChecked((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    )
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <StepHeading title={t('title')}>{t('lead')}</StepHeading>
      <fieldset className="mt-7 space-y-1">
        <legend className="sr-only">{t('legend')}</legend>
        {options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer gap-3.5 py-3 text-[15px] leading-snug"
          >
            <span className="relative mt-px grid size-[22px] shrink-0">
              <input
                type="checkbox"
                checked={checked.includes(option.id)}
                onChange={() => {
                  toggle(option.id)
                }}
                className="peer size-[22px] cursor-pointer appearance-none rounded-full border-[1.5px] border-foreground/35 transition-colors checked:border-primary checked:bg-primary"
              />
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="pointer-events-none absolute inset-0 m-auto size-3 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100"
              >
                <path
                  d="M3.5 8.5l3 3 6-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>
              <ConsentLabel id={option.id} />
            </span>
          </label>
        ))}
      </fieldset>
      <StepActions>
        <ActionError error={error} />
        <Button
          size="lg"

          disabled={!ready || pending}
          onClick={() => {
            submit(
              options
                .filter((option) => checked.includes(option.id))
                .flatMap((option) => option.kinds),
            )
          }}
        >
          {pending ? t('saving') : t('submit')}
        </Button>
      </StepActions>
    </section>
  )
}
