'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Switch } from '@/shared/ui/switch'
import { FormMessage } from './form-message'

interface AiConsentSwitchProps {
  enabled: boolean
  setAiConsent: (enabled: boolean) => Promise<ActionResult<string>>
}

export function AiConsentSwitch({ enabled, setAiConsent }: AiConsentSwitchProps) {
  const t = useTranslations('account.consents.kinds')
  const [checked, setChecked] = useState(enabled)
  const { submit, pending, error } = useSubmit(setAiConsent, () => undefined)

  return (
    <div className="flex flex-col items-end gap-1">
      <Switch
        checked={checked}
        label={t('ai_processing')}
        disabled={pending}
        onChange={(next) => {
          setChecked(next)
          submit(next)
        }}
      />
      <FormMessage error={error} notice={null} />
    </div>
  )
}
