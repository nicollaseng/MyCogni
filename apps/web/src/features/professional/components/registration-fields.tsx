'use client'

import {
  brazilianStates,
  formatRegistration,
  isBrazilianState,
  isRegistrationNumber,
  registrationDigits,
  type ProfessionalCouncil,
} from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { Chevron } from '@/shared/components/disclosure'
import { TextField } from '@/shared/ui/text-field'
import { stateNames } from '../states'

interface RegistrationFieldsProps {
  council: ProfessionalCouncil
  uf: string
  number: string
  ufError: string | undefined
  numberError: string | undefined
  onChange: (changes: { uf?: string; number?: string }) => void
}

function previewOf(council: ProfessionalCouncil, uf: string, number: string): string | null {
  return isBrazilianState(uf) && isRegistrationNumber(number)
    ? formatRegistration({ council, uf, number })
    : null
}

export function RegistrationFields({
  council,
  uf,
  number,
  ufError,
  numberError,
  onChange,
}: RegistrationFieldsProps) {
  const t = useTranslations('professional.form')
  const ids = useId()
  const preview = previewOf(council, uf, number)

  return (
    <fieldset className="space-y-3" aria-describedby={`${ids}-hint`}>
      <legend className="mb-3 text-sm font-medium">{t(`councils.${council}`)}</legend>
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start gap-3">
        <div className="space-y-2">
          <label htmlFor={`${ids}-uf`} className="block text-sm font-medium">
            {t('uf')}
          </label>
          <div className="relative">
            <select
              id={`${ids}-uf`}
              value={uf}
              aria-invalid={ufError === undefined ? undefined : true}
              aria-describedby={ufError === undefined ? undefined : `${ids}-uf-error`}
              onChange={(event) => {
                onChange({ uf: event.currentTarget.value })
              }}
              className="h-12 w-full appearance-none truncate rounded-md border border-rule bg-background pr-9 pl-4 text-base transition-colors outline-none focus:border-foreground aria-invalid:border-danger"
            >
              <option value="" disabled>
                {t('ufPlaceholder')}
              </option>
              {brazilianStates.map((state) => (
                <option key={state} value={state}>
                  {`${state} · ${stateNames[state]}`}
                </option>
              ))}
            </select>
            <Chevron
              open={false}
              className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>
        <TextField
          label={t('number')}
          inputMode="numeric"
          autoComplete="off"
          value={number}
          error={numberError}
          onChange={(event) => {
            onChange({ number: registrationDigits(event.currentTarget.value) })
          }}
        />
      </div>
      {ufError !== undefined && (
        <p id={`${ids}-uf-error`} className="text-sm text-danger">
          {ufError}
        </p>
      )}
      <p id={`${ids}-hint`} className="text-sm text-pretty text-muted-foreground">
        {preview === null ? t(`councilHints.${council}`) : t('preview', { registration: preview })}
      </p>
    </fieldset>
  )
}
