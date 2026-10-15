'use client'

import { professionalKinds, requiresRegistration, type ProfessionalKind } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useId, useState, type SubmitEvent } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { useSubmit } from '@/shared/hooks/use-submit'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { joinIssues, type Join, type JoinIssue, type JoinValues } from '../join'

const documentLink = 'underline decoration-1 underline-offset-4'

const emptyValues: JoinValues = { kind: null, fullName: '', registration: '', accepted: false }

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

function KindOption({
  kind,
  checked,
  onChoose,
}: {
  kind: ProfessionalKind
  checked: boolean
  onChoose: (kind: ProfessionalKind) => void
}) {
  const t = useTranslations('common.professionalKinds')
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center justify-center rounded-[6px] border px-4 py-2.5 text-[15px] transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foreground',
        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-rule hover:bg-sage',
      )}
    >
      <input
        type="radio"
        name="kind"
        value={kind}
        checked={checked}
        onChange={() => {
          onChoose(kind)
        }}
        className="sr-only"
      />
      {t(kind)}
    </label>
  )
}

export function JoinForm({ join }: { join: Join }) {
  const t = useTranslations('professional.form')
  const ids = useId()
  const [values, setValues] = useState<JoinValues>(emptyValues)
  const [attempted, setAttempted] = useState(false)
  const { submit, pending, error } = useSubmit(join, () => undefined)
  const issues = attempted ? joinIssues(values) : {}
  const registrationRequired = values.kind === null || requiresRegistration(values.kind)

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
      <fieldset
        className="space-y-3"
        aria-describedby={issues.kind === undefined ? undefined : `${ids}-kind`}
      >
        <legend className="mb-3 text-sm font-medium">{t('kind')}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {professionalKinds.map((kind) => (
            <KindOption
              key={kind}
              kind={kind}
              checked={values.kind === kind}
              onChoose={(chosen) => {
                update({ kind: chosen })
              }}
            />
          ))}
        </div>
        <FieldError id={`${ids}-kind`} message={message(issues.kind)} />
      </fieldset>

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

      <TextField
        label={registrationRequired ? t('registration') : t('registrationOptional')}
        hint={t(`registrationHints.${values.kind ?? 'psychologist'}`)}
        error={message(issues.registration)}
        autoComplete="off"
        maxLength={40}
        value={values.registration}
        onChange={(event) => {
          update({ registration: event.currentTarget.value })
        }}
      />

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
