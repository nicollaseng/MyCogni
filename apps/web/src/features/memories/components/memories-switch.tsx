'use client'

import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { FormMessage } from '@/features/account/components/form-message'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Switch } from '@/shared/ui/switch'

interface MemoriesSwitchProps {
  enabled: boolean
  setMemoriesEnabled: (enabled: boolean) => Promise<ActionResult<string>>
}

export function MemoriesSwitch({ enabled, setMemoriesEnabled }: MemoriesSwitchProps) {
  const t = useTranslations('memories.switch')
  const hintId = useId()
  const [checked, setChecked] = useState(enabled)
  const [notice, setNotice] = useState<string | null>(null)
  const { submit, pending, error } = useSubmit(async (next: boolean) => {
    setNotice(null)
    const result = await setMemoriesEnabled(next)
    if (!result.ok) {
      setChecked(!next)
    }
    return result
  }, setNotice)

  return (
    <div className="flex items-start justify-between gap-6 py-3.5">
      <div className="space-y-1">
        <p>{t('label')}</p>
        <p id={hintId} className="max-w-md text-sm text-pretty text-muted-foreground">
          {t('hint')}
        </p>
        <FormMessage error={error} notice={notice} />
      </div>
      <div className="pt-0.5">
        <Switch
          checked={checked}
          label={t('label')}
          describedBy={hintId}
          disabled={pending}
          onChange={(next) => {
            setChecked(next)
            submit(next)
          }}
        />
      </div>
    </div>
  )
}
