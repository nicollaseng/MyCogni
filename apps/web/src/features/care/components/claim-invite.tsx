'use client'

import { useTranslations } from 'next-intl'
import { ActionError } from '@/shared/components/action-error'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'

export function ClaimInvite({ claim }: { claim: () => Promise<ActionResult<null>> }) {
  const t = useTranslations('care.invite.pending')
  const { submit, pending, error } = useSubmit(claim, () => undefined)

  return (
    <div>
      <ActionError error={error} />
      <Button
        size="lg"

        className="w-full"
        disabled={pending}
        onClick={() => {
          submit()
        }}
      >
        {pending ? t('opening') : t('open')}
      </Button>
    </div>
  )
}
