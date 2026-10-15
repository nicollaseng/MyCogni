'use client'

import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Switch } from '@/shared/ui/switch'
import { FormMessage } from './form-message'

interface JournalInsightsSwitchProps {
  enabled: boolean
  setJournalInInsights: (enabled: boolean) => Promise<ActionResult<string>>
}

export function JournalInsightsSwitch({
  enabled,
  setJournalInInsights,
}: JournalInsightsSwitchProps) {
  const t = useTranslations('account.journal')
  const hintId = useId()
  const [checked, setChecked] = useState(enabled)
  const { submit, pending, error } = useSubmit(
    async (next: boolean) => {
      const result = await setJournalInInsights(next)
      if (!result.ok) {
        setChecked(!next)
      }
      return result
    },
    () => undefined,
  )

  return (
    <div className="flex items-start justify-between gap-6 py-3.5">
      <div className="space-y-1">
        <p>{t('label')}</p>
        <p id={hintId} className="max-w-md text-sm text-pretty text-muted-foreground">
          {t('hint')}
        </p>
        <FormMessage error={error} notice={null} />
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
