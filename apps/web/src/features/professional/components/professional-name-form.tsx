'use client'

import { useTranslations } from 'next-intl'
import { useState, type SubmitEvent } from 'react'
import { FormMessage } from '@/features/account/components/form-message'
import { useCloseRow } from '@/features/account/components/settings-row'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'

interface ProfessionalNameFormProps {
  initialName: string
  rename: (fullName: string) => Promise<ActionResult<string>>
}

const nameLimits = { min: 3, max: 120 }

export function ProfessionalNameForm({ initialName, rename }: ProfessionalNameFormProps) {
  const t = useTranslations('professional.settings.profile')
  const close = useCloseRow()
  const [name, setName] = useState(initialName)
  const { submit, pending, error } = useSubmit(rename, close)
  const length = name.trim().length

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    submit(name)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TextField
        label={t('name')}
        hint={t('nameHint')}
        autoComplete="name"
        maxLength={nameLimits.max}
        value={name}
        onChange={(event) => {
          setName(event.currentTarget.value)
        }}
      />
      <FormMessage error={error} notice={null} />
      <Button
        type="submit"
        size="sm"
        className="h-9 px-4 text-sm"
        disabled={pending || length < nameLimits.min}
      >
        {pending ? t('saving') : t('save')}
      </Button>
    </form>
  )
}
