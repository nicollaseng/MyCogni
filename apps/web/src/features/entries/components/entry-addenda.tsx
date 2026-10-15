'use client'

import { checkInLimits } from '@mycogni/domain'
import type { CheckInAddendum } from '@mycogni/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useState, useTransition, type SubmitEvent } from 'react'
import { unlessOutdated } from '@/shared/lib/actions/outdated'
import type { ActionResult } from '@/shared/lib/actions/result'
import { formatDayMonth, formatTime } from '@/shared/lib/time'
import { Button } from '@/shared/ui/button'
import { bindShortWords } from '@/shared/lib/text'

interface EntryAddendaProps {
  addenda: readonly CheckInAddendum[]
  timeZone: string
  append?: (text: string) => Promise<ActionResult<CheckInAddendum>>
}

const nearLimit = 100

export function EntryAddenda({ addenda, timeZone, append }: EntryAddendaProps) {
  const t = useTranslations('entries.detail')
  const locale = useLocale()
  const headingId = useId()
  const fieldId = useId()
  const hintId = useId()
  const [items, setItems] = useState(addenda)
  const [writing, setWriting] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const remaining = checkInLimits.addendum - text.length

  function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (append === undefined) {
      return
    }
    startTransition(async () => {
      const result = await unlessOutdated(() => append(text))
      if (result === null) {
        return
      }
      if (!result.ok) {
        setError(result.error)
        return
      }
      setItems((current) => [...current, result.value])
      setText('')
      setError(null)
      setWriting(false)
    })
  }

  return (
    <div className="space-y-6">
      {items.length > 0 && (
        <section aria-labelledby={headingId} className="space-y-4">
          <h2 id={headingId} className="text-[15px] font-medium">
            {t('addenda')}
          </h2>
          <ol className="space-y-5">
            {items.map((addendum) => {
              const createdAt = new Date(addendum.createdAt)
              return (
                <li key={addendum.id} className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <time dateTime={addendum.createdAt}>
                      {formatDayMonth(createdAt, timeZone, locale)} ·{' '}
                      {formatTime(createdAt, timeZone, locale)}
                    </time>
                  </p>
                  <p className="font-serif text-[17px] leading-relaxed text-pretty whitespace-pre-line">
                    {bindShortWords(addendum.text)}
                  </p>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {append !== undefined &&
        (writing ? (
          <form onSubmit={save} className="space-y-3">
            <label htmlFor={fieldId} className="block text-[15px] font-medium">
              {t('label')}
            </label>
            <textarea
              id={fieldId}
              value={text}
              rows={4}
              maxLength={checkInLimits.addendum}
              aria-describedby={hintId}
              autoFocus
              onChange={(event) => {
                setText(event.currentTarget.value)
              }}
              className="block w-full resize-y rounded-[6px] border border-rule bg-background px-3.5 py-3 font-serif text-[17px] leading-relaxed outline-none focus:border-foreground"
            />
            <p id={hintId} className="text-sm text-pretty text-muted-foreground">
              {t('hint')}
              {remaining <= nearLimit && (
                <span className="block tabular-nums">{t('remaining', { count: remaining })}</span>
              )}
            </p>
            {error !== null && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" size="sm" disabled={pending || text.trim() === ''}>
                {t('save')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setWriting(false)
                  setText('')
                  setError(null)
                }}
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        ) : (
          <Button
            onClick={() => {
              setWriting(true)
            }}
          >
            {t('writeMore')}
          </Button>
        ))}
    </div>
  )
}
