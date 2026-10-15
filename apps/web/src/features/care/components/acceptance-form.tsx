'use client'

import type { AcceptInvitationInput } from '@mycogni/contracts'
import { sharingConsentVersion } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState, type ReactNode } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Switch } from '@/shared/ui/switch'

interface AcceptanceFormProps {
  professionalName: string
  accept: (input: AcceptInvitationInput) => Promise<ActionResult<null>>
  decline: () => Promise<ActionResult<null>>
  children: ReactNode
}

export function AcceptanceForm({
  professionalName,
  accept,
  decline,
  children,
}: AcceptanceFormProps) {
  const t = useTranslations('care.accept')
  const [sharesHistory, setSharesHistory] = useState(false)
  const accepting = useSubmit(accept, () => undefined)
  const declining = useSubmit(decline, () => undefined)
  const busy = accepting.pending || declining.pending

  return (
    <>
      <div className="flex items-center justify-between gap-5">
        <div className="space-y-1">
          <p className="leading-snug">{t('history.label')}</p>
          <p className="text-sm text-pretty text-muted-foreground">
            {t(sharesHistory ? 'history.on' : 'history.off', { name: professionalName })}
          </p>
        </div>
        <Switch
          checked={sharesHistory}
          label={t('history.label')}
          disabled={busy}
          onChange={setSharesHistory}
        />
      </div>

      {children}

      <div>
        <ActionError error={accepting.error ?? declining.error} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            disabled={busy}
            onClick={() => {
              accepting.submit({ sharesHistory, consentVersion: sharingConsentVersion })
            }}
          >
            {accepting.pending ? t('accepting') : t('submit')}
          </Button>
          <Button
            variant="outline"

            disabled={busy}
            onClick={() => {
              declining.submit()
            }}
          >
            {declining.pending ? t('declining') : t('decline')}
          </Button>
          <Link href="/invites" className={buttonVariants({ variant: 'ghost' })}>
            {t('later')}
          </Link>
        </div>
      </div>
    </>
  )
}
