'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { StepActions } from '@/shared/components/step-actions'
import { StepHeading } from '@/shared/components/step-heading'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'

const documentLink = 'underline decoration-1 underline-offset-4'

interface TermsUpdateProps {
  accept: () => Promise<ActionResult<null>>
  signOut: () => Promise<void>
}

export function TermsUpdate({ accept, signOut }: TermsUpdateProps) {
  const t = useTranslations('legal.update')
  const [checked, setChecked] = useState(false)
  const { submit, pending, error } = useSubmit(accept, () => undefined)

  return (
    <div className="flex h-dvh flex-col">
      <main className="mx-auto flex min-h-0 w-full max-w-[460px] flex-1 flex-col px-6 pt-5">
        <StepHeading title={t('title')}>{t('lead')}</StepHeading>
        <label className="mt-7 flex cursor-pointer gap-3.5 py-3 text-[15px] leading-snug">
          <span className="relative mt-px grid size-[22px] shrink-0">
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => {
                setChecked(event.currentTarget.checked)
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
            {t.rich('accept', {
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
            })}
          </span>
        </label>
        <StepActions>
          <ActionError error={error} />
          <Button
            size="lg"
            disabled={!checked || pending}
            onClick={() => {
              submit()
            }}
          >
            {t('continue')}
          </Button>
          <form action={signOut} className="mt-2 flex justify-center">
            <Button type="submit" variant="ghost">
              {t('signOut')}
            </Button>
          </form>
        </StepActions>
      </main>
    </div>
  )
}
