'use client'

import { emergencyWhatsappOf, emergencyWhatsappParts } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useState, type SubmitEvent } from 'react'
import { FormMessage } from '@/features/account/components/form-message'
import { useCloseRow } from '@/features/account/components/settings-row'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'

interface EmergencyWhatsappFormProps {
  initial: string | null
  save: (emergencyWhatsapp: string | null) => Promise<ActionResult<string | null>>
}

export function EmergencyWhatsappForm({ initial, save }: EmergencyWhatsappFormProps) {
  const t = useTranslations('professional.settings.whatsapp')
  const close = useCloseRow()
  const parts = emergencyWhatsappParts(initial)
  const [countryCode, setCountryCode] = useState(parts.countryCode)
  const [number, setNumber] = useState(parts.number)
  const [invalid, setInvalid] = useState(false)
  const { submit, pending, error } = useSubmit(save, close)

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = emergencyWhatsappOf(countryCode, number)
    setInvalid(value === null)
    if (value !== null) {
      submit(value)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-[6.5rem_1fr] items-start gap-3">
        <TextField
          label={t('countryCode')}
          inputMode="tel"
          autoComplete="tel-country-code"
          maxLength={5}
          value={countryCode}
          onChange={(event) => {
            setCountryCode(event.currentTarget.value)
          }}
        />
        <TextField
          label={t('number')}
          inputMode="tel"
          autoComplete="tel-national"
          maxLength={24}
          placeholder={t('placeholder')}
          value={number}
          error={invalid ? t('invalid') : undefined}
          onChange={(event) => {
            setNumber(event.currentTarget.value)
          }}
        />
      </div>
      <p className="text-sm text-pretty text-muted-foreground">{t('hint')}</p>
      <FormMessage error={error} notice={null} />
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          size="sm"
          className="h-9 px-4 text-sm"
          disabled={pending || number.trim() === ''}
        >
          {pending ? t('saving') : t('save')}
        </Button>
        {initial !== null && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 text-sm"
            disabled={pending}
            onClick={() => {
              submit(null)
            }}
          >
            {t('clear')}
          </Button>
        )}
      </div>
    </form>
  )
}
