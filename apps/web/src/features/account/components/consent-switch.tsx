'use client'

import type { ConsentKind } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Switch } from '@/shared/ui/switch'
import { FormMessage } from './form-message'

export type SetConsent = (kind: ConsentKind, enabled: boolean) => Promise<ActionResult<string>>

interface ConsentSwitchProps {
  kind: ConsentKind
  enabled: boolean
  setConsent: SetConsent
}

export function ConsentSwitch({ kind, enabled, setConsent }: ConsentSwitchProps) {
  const t = useTranslations('account.consents.kinds')
  const [checked, setChecked] = useState(enabled)
  const { submit, pending, error } = useSubmit(setConsent, () => undefined)

  return (
    <div className="flex flex-col items-end gap-1">
      <Switch
        checked={checked}
        label={t(kind)}
        disabled={pending}
        onChange={(next) => {
          setChecked(next)
          submit(kind, next)
        }}
      />
      <FormMessage error={error} notice={null} />
    </div>
  )
}
