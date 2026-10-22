'use client'

import type {
  CreateAssignmentInput,
  ProfessionalAssignment,
  QuestionnaireCatalog,
  QuestionnaireCatalogOption,
} from '@mycogni/contracts'
import {
  assignmentNoteMaxLength,
  questionnaireText,
  repeatIntervals,
  type QuestionnaireArea,
  type QuestionnaireVariant,
  type RepeatInterval,
} from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useState, useTransition } from 'react'
import { ActionError } from '@/shared/components/action-error'
import type { ActionResult } from '@/shared/lib/actions/result'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { formatShortDate } from '../dates'

export type ReleaseAction = (
  input: CreateAssignmentInput,
) => Promise<ActionResult<ProfessionalAssignment>>

interface ReleaseFormProps {
  catalog: QuestionnaireCatalog
  release: ReleaseAction
  onReleased: () => void
}

type RepeatChoice = 'none' | `${RepeatInterval}`

const repeatChoices: readonly RepeatChoice[] = ['none', '7', '14', '28']

function repeatOf(choice: RepeatChoice): RepeatInterval | null {
  return repeatIntervals.find((days) => String(days) === choice) ?? null
}

function firstAvailable(
  options: readonly QuestionnaireCatalogOption[],
): QuestionnaireVariant | null {
  return options.find((option) => option.unavailableReason === null)?.variant ?? null
}

const tag = 'inline-flex items-center rounded-[4px] bg-background px-1.5 py-0.5 text-[12px]'

function InstrumentOption({
  option,
  name,
  checked,
  onChoose,
}: {
  option: QuestionnaireCatalogOption
  name: string
  checked: boolean
  onChoose: () => void
}) {
  const t = useTranslations('assignments')
  const disabled = option.unavailableReason !== null
  const descriptionId = useId()
  const notice = questionnaireText(option.variant, 'en-US')?.notice ?? null
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-[6px] px-3 py-3 transition-colors',
        checked && 'bg-background shadow-[0_0_0_1px_var(--rule)]',
        disabled ? 'cursor-not-allowed opacity-70' : 'hover:bg-background/60',
      )}
    >
      <input
        type="radio"
        name={name}
        value={option.variant}
        checked={checked}
        disabled={disabled}
        aria-describedby={descriptionId}
        onChange={onChoose}
        className="mt-1 size-4 shrink-0 accent-(--primary)"
      />
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium">
            {option.variant === 'asrs6' ? t('names.asrs6') : option.name}
          </span>
          <span className={cn(tag, 'text-muted-foreground')}>
            {t('dialog.satepsi', { status: t(`dialog.satepsiStatus.${option.satepsi.status}`) })}
          </span>
          {option.safetyItem && (
            <span className={cn(tag, 'text-(--warn)')}>{t('dialog.safetyItem')}</span>
          )}
        </span>
        <span id={descriptionId} className="block space-y-1 text-sm text-muted-foreground">
          <span className="block">
            {t('dialog.items', { count: option.itemCount })} ·{' '}
            {t('dialog.minutes', { minutes: option.minutes })} ·{' '}
            {option.uses.map((use) => t(`dialog.uses.${use}`)).join(', ')}
          </span>
          {notice !== null && <span className="block text-[12px]">{notice}</span>}
          {option.unavailableReason !== null ? (
            <span className="block font-medium text-foreground">
              {t(`dialog.reasons.${option.unavailableReason}`)}
            </span>
          ) : (
            <span className="block text-pretty">
              {t(`dialog.recommendations.${option.variant}`)}
            </span>
          )}
        </span>
      </span>
    </label>
  )
}

export function ReleaseForm({ catalog, release, onReleased }: ReleaseFormProps) {
  const t = useTranslations('assignments')
  const locale = useLocale()
  const name = useId()
  const noteId = useId()
  const [area, setArea] = useState<QuestionnaireArea>(catalog.areas[0]?.area ?? 'depression')
  const options = catalog.areas.find((entry) => entry.area === area)?.options ?? []
  const [variant, setVariant] = useState<QuestionnaireVariant | null>(() => firstAvailable(options))
  const [note, setNote] = useState('')
  const [repeat, setRepeat] = useState<RepeatChoice>('none')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const checkedOn = catalog.areas[0]?.options[0]?.satepsi.checkedOn

  function chooseArea(next: QuestionnaireArea) {
    setArea(next)
    setVariant(firstAvailable(catalog.areas.find((entry) => entry.area === next)?.options ?? []))
  }

  function submit() {
    if (variant === null) {
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await release({ variant, note, repeatEveryDays: repeatOf(repeat) })
      if (result.ok) {
        onReleased()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">{t('dialog.condition')}</legend>
        <div className="grid gap-1 rounded-[8px] bg-surface p-1.5">
          {catalog.areas.map((entry) => (
            <label
              key={entry.area}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-[6px] px-3 py-2 text-[15px] transition-colors',
                entry.area === area
                  ? 'bg-background font-medium shadow-[0_0_0_1px_var(--rule)]'
                  : 'hover:bg-background/60',
              )}
            >
              <input
                type="radio"
                name={`${name}-area`}
                value={entry.area}
                checked={entry.area === area}
                onChange={() => {
                  chooseArea(entry.area)
                }}
                className="size-4 accent-(--primary)"
              />
              {t(`areas.${entry.area}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">{t('dialog.instrument')}</legend>
        <div className="grid gap-1 rounded-[8px] bg-surface p-1.5">
          {options.map((option) => (
            <InstrumentOption
              key={option.variant}
              option={option}
              name={`${name}-variant`}
              checked={variant === option.variant}
              onChoose={() => {
                setVariant(option.variant)
              }}
            />
          ))}
        </div>
        {checkedOn !== undefined && (
          <p className="text-[13px] text-muted-foreground">
            {t('dialog.satepsiChecked', {
              date: formatShortDate(new Date(`${checkedOn}T12:00:00Z`), 'UTC', locale),
            })}
          </p>
        )}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor={noteId} className="block text-sm font-medium">
          {t('dialog.note')}
        </label>
        <textarea
          id={noteId}
          value={note}
          maxLength={assignmentNoteMaxLength}
          rows={3}
          onChange={(event) => {
            setNote(event.currentTarget.value)
          }}
          className="w-full resize-none rounded-[6px] border border-rule bg-background/70 px-3 py-2 text-[15px] leading-relaxed outline-none focus:border-foreground/60 focus:bg-background dark:bg-white/5"
        />
        <p className="flex justify-between gap-4 text-[13px] text-muted-foreground">
          <span>{t('dialog.noteHint', { max: assignmentNoteMaxLength })}</span>
          <span className="tabular-nums">
            {note.length}/{assignmentNoteMaxLength}
          </span>
        </p>
      </div>

      <div className="space-y-2">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t('dialog.repeat')}</legend>
          <div className="grid grid-cols-2 gap-1 rounded-[8px] bg-surface p-1.5">
            {repeatChoices.map((choice) => (
              <label
                key={choice}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-[6px] px-3 py-2 text-[15px] transition-colors',
                  choice === repeat
                    ? 'bg-background font-medium shadow-[0_0_0_1px_var(--rule)]'
                    : 'hover:bg-background/60',
                )}
              >
                <input
                  type="radio"
                  name={`${name}-repeat`}
                  value={choice}
                  checked={choice === repeat}
                  onChange={() => {
                    setRepeat(choice)
                  }}
                  className="size-4 accent-(--primary)"
                />
                {choice === 'none'
                  ? t('dialog.repeatOptions.none')
                  : t('dialog.repeatOptions.days', { days: Number(choice) })}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="text-[13px] text-muted-foreground">{t('dialog.repeatHint')}</p>
      </div>

      <div className="space-y-2 pt-1">
        <ActionError error={error} />
        <Button type="submit" className="w-full" disabled={variant === null || pending}>
          {pending ? t('dialog.sending') : t('dialog.submit')}
        </Button>
      </div>
    </form>
  )
}
