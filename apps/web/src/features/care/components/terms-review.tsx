'use client'

import type { ConfirmSharingTermsInput } from '@mycogni/contracts'
import { sharingConsentVersion } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'
import { EndCareLinkConfirmation } from './end-care-link'

interface TermsReviewProps {
  id: string
  name: string
  confirm: (input: ConfirmSharingTermsInput) => Promise<ActionResult<null>>
  end: (id: string) => Promise<ActionResult<null>>
}

export function TermsReview({ id, name, confirm, end }: TermsReviewProps) {
  const t = useTranslations('care')
  const [ending, setEnding] = useState(false)
  const confirming = useSubmit(confirm, () => undefined)

  if (ending) {
    return (
      <EndCareLinkConfirmation
        id={id}
        name={name}
        end={end}
        onClose={() => {
          setEnding(false)
        }}
      />
    )
  }

  return (
    <div>
      <ActionError error={confirming.error} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          disabled={confirming.pending}
          onClick={() => {
            confirming.submit({ consentVersion: sharingConsentVersion })
          }}
        >
          {confirming.pending ? t('terms.confirming') : t('terms.confirm')}
        </Button>
        <Button
          variant="outline"
          disabled={confirming.pending}
          onClick={() => {
            setEnding(true)
          }}
        >
          {t('links.end.open')}
        </Button>
      </div>
    </div>
  )
}
