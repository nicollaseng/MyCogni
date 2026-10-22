'use client'

import {
  councilOf,
  institutionRegistrationLimits,
  professionalKinds,
  type ProfessionalKind,
} from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useId, useState, type SubmitEvent } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { Chevron } from '@/shared/components/disclosure'
import { useSubmit } from '@/shared/hooks/use-submit'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { emptyJoinValues, joinIssues, type Join, type JoinIssue, type JoinValues } from '../join'
import { RegistrationFields } from './registration-fields'

const documentLink = 'underline decoration-1 underline-offset-4'

function kindOf(value: string): ProfessionalKind | null {
  return professionalKinds.find((kind) => kind === value) ?? null
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (message === undefined) {
    return null
  }
  return (
    <p id={id} className="text-sm text-danger">
      {message}
    </p>
  )
}

export function JoinForm({ join }: { join: Join }) {
  const t = useTranslations('professional.form')
  const kinds = useTranslations('common.professionalKinds')
  const ids = useId()
  const [values, setValues] = useState<JoinValues>(emptyJoinValues)
  const [attempted, setAttempted] = useState(false)
  const { submit, pending, error } = useSubmit(join, () => undefined)
  const issues = attempted ? joinIssues(values) : {}
  const council = values.kind === null ? null : councilOf(values.kind)

  function message(issue: JoinIssue | undefined): string | undefined {
    return issue === undefined ? undefined : t(`errors.${issue}`)
  }

  function update(changes: Partial<JoinValues>) {
    setValues((current) => ({ ...current, ...changes }))
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setAttempted(true)
    if (Object.keys(joinIssues(values)).length === 0) {
      submit(values)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <label htmlFor={`${ids}-kind-field`} className="block text-sm font-medium">
          {t('kind')}
        </label>
        <div className="relative">
          <select
            id={`${ids}-kind-field`}
            value={values.kind ?? ''}
            aria-invalid={issues.kind === undefined ? undefined : true}
            aria-describedby={issues.kind === undefined ? undefined : `${ids}-kind`}
            onChange={(event) => {
              update({ kind: kindOf(event.currentTarget.value) })
            }}
            className="h-12 w-full appearance-none truncate rounded-md border border-rule bg-background pr-9 pl-4 text-base transition-colors outline-none focus:border-foreground aria-invalid:border-danger"
          >
            <option value="" disabled>
              {t('kindPlaceholder')}
            </option>
            {professionalKinds.map((kind) => (
              <option key={kind} value={kind}>
                {kinds(kind)}
              </option>
            ))}
          </select>
          <Chevron
            open={false}
            className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground"
          />
        </div>
        <FieldError id={`${ids}-kind`} message={message(issues.kind)} />
      </div>

      <TextField
        label={t('fullName')}
        hint={t('fullNameHint')}
        error={message(issues.fullName)}
        autoComplete="name"
        maxLength={120}
        value={values.fullName}
        onChange={(event) => {
          update({ fullName: event.currentTarget.value })
        }}
      />

      {council !== null && (
        <RegistrationFields
          council={council}
          uf={values.uf}
          number={values.number}
          ufError={message(issues.uf)}
          numberError={message(issues.number)}
          onChange={update}
        />
      )}

      {values.kind !== null && council === null && (
        <TextField
          label={t('institution')}
          hint={t('institutionHint')}
          error={message(issues.institution)}
          autoComplete="off"
          maxLength={institutionRegistrationLimits.max}
          value={values.institutionRegistration}
          onChange={(event) => {
            update({ institutionRegistration: event.currentTarget.value })
          }}
        />
      )}

      <div className="space-y-2">
        <label className="flex cursor-pointer gap-3.5 text-[15px] leading-snug">
          <span className="relative mt-px grid size-[22px] shrink-0">
            <input
              type="checkbox"
              checked={values.accepted}
              aria-invalid={issues.consent === undefined ? undefined : true}
              aria-describedby={issues.consent === undefined ? undefined : `${ids}-consent`}
              onChange={(event) => {
                update({ accepted: event.currentTarget.checked })
              }}
              className="peer size-[22px] cursor-pointer appearance-none rounded-full border-[1.5px] border-foreground/35 transition-colors checked:border-primary checked:bg-primary aria-invalid:border-danger"
            />
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              className="pointer-events-none absolute inset-0 m-auto size-3 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100"
            >
              <path
                d="M3.5 8.5l3 3 6-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            {t.rich('consent', {
              terms: (chunks) => (
                <Link href="/terms" target="_blank" className={documentLink}>
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" target="_blank" className={documentLink}>
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        <FieldError id={`${ids}-consent`} message={message(issues.consent)} />
      </div>

      <div>
        <ActionError error={error} />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t('sending') : t('submit')}
        </Button>
      </div>
    </form>
  )
}
