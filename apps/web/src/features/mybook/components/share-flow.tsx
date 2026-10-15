'use client'

import type { CreateJournalShareInput, JournalEntrySummary } from '@mycogni/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useState, type ReactNode } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'
import { formatDay, formatPageDate } from '../dates'
import {
  durationChoices,
  durationOf,
  expiresAtOf,
  firstDayToChoose,
  matchingPages,
  type DurationChoice,
} from '../sharing'
import { SearchField } from './search-field'

type Scope = CreateJournalShareInput['scope']

interface ShareFlowProps {
  careLinkId: string
  name: string
  pages: readonly JournalEntrySummary[]
  preselected: readonly string[]
  initiallyOpen: boolean
  hasShares: boolean
  now: string
  timeZone: string
  share: (input: CreateJournalShareInput) => Promise<ActionResult<null>>
}

interface ChoiceProps {
  name: string
  checked: boolean
  onSelect: () => void
  label: string
  hint?: string
}

function Choice({ name, checked, onSelect, label, hint }: ChoiceProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[14px] bg-background/60 px-4 py-3 transition-colors duration-150 hover:bg-sage has-[:checked]:bg-sage has-[:checked]:ring-1 has-[:checked]:ring-foreground/15 motion-reduce:transition-none">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="mt-1 size-4 shrink-0 accent-primary"
      />
      <span className="min-w-0">
        <span className="block">{label}</span>
        {hint !== undefined && (
          <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{hint}</span>
        )}
      </span>
    </label>
  )
}

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="mb-2 px-1 text-sm text-muted-foreground">{legend}</legend>
      {children}
    </fieldset>
  )
}

function ShareForm({
  careLinkId,
  name,
  pages,
  preselected,
  now,
  timeZone,
  share,
  onClose,
}: Omit<ShareFlowProps, 'initiallyOpen' | 'hasShares'> & { onClose: () => void }) {
  const t = useTranslations('mybook.sharing.flow')
  const book = useTranslations('mybook')
  const locale = useLocale()
  const id = useId()
  const today = new Date(now)
  const [scope, setScope] = useState<Scope>(pages.length > 0 ? 'entries' : 'all')
  const [selected, setSelected] = useState<readonly string[]>(preselected)
  const [query, setQuery] = useState('')
  const [choice, setChoice] = useState<DurationChoice>('week')
  const [until, setUntil] = useState('')
  const { submit, pending, error } = useSubmit(share, onClose)

  const duration = durationOf(choice, until, today, timeZone)
  const expiresAt = duration === null ? null : expiresAtOf(duration, today, timeZone)
  const titleOf = (pageId: string | undefined) =>
    pages.find((page) => page.id === pageId)?.title ?? book('untitled')
  const what =
    scope === 'all'
      ? t('what.all')
      : selected.length === 1
        ? t('what.one', { title: titleOf(selected[0]) })
        : t('what.many', { count: selected.length })
  const problem =
    scope === 'entries' && selected.length === 0
      ? t('needPages')
      : duration === null
        ? t('needDate')
        : null
  const sentence =
    duration?.kind === 'forever'
      ? t('confirmForever', { name, what })
      : expiresAt === null
        ? null
        : t('confirmUntil', { name, what, date: formatDay(expiresAt, today, timeZone, locale) })

  function toggle(pageId: string) {
    setSelected((current) =>
      current.includes(pageId)
        ? current.filter((candidate) => candidate !== pageId)
        : [...current, pageId],
    )
  }

  function confirm() {
    const chosen = durationOf(choice, until, new Date(), timeZone)
    if (problem !== null || chosen === null) {
      return
    }
    const expiry = expiresAtOf(chosen, new Date(), timeZone)?.toISOString() ?? null
    submit(
      scope === 'all'
        ? { careLinkId, scope, expiresAt: expiry }
        : { careLinkId, scope, entryIds: [...selected], expiresAt: expiry },
    )
  }

  const visible = matchingPages(pages, query)

  return (
    <div className="space-y-6 pt-1">
      <Group legend={t('scope.legend')}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice
            name={`${id}-scope`}
            checked={scope === 'entries'}
            onSelect={() => {
              setScope('entries')
            }}
            label={t('scope.entries')}
          />
          <Choice
            name={`${id}-scope`}
            checked={scope === 'all'}
            onSelect={() => {
              setScope('all')
            }}
            label={t('scope.all')}
            hint={t('scope.allHint')}
          />
        </div>
      </Group>

      {scope === 'entries' && (
        <Group legend={t('pages.legend')}>
          {pages.length === 0 ? (
            <p className="px-1 text-muted-foreground">{t('pages.empty')}</p>
          ) : (
            <div className="space-y-2">
              <SearchField
                label={t('pages.search')}
                placeholder={t('pages.search')}
                initial=""
                delay={0}
                onSearch={setQuery}
              />
              <ul className="max-h-80 space-y-0.5 overflow-y-auto rounded-[16px] bg-background/60 p-1.5">
                {visible.map((page) => (
                  <li key={page.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-[12px] px-3 py-2.5 transition-colors duration-150 hover:bg-sage has-[:checked]:bg-sage motion-reduce:transition-none">
                      <input
                        type="checkbox"
                        checked={selected.includes(page.id)}
                        onChange={() => {
                          toggle(page.id)
                        }}
                        className="mt-1 size-[18px] shrink-0 accent-primary"
                      />
                      <span className="min-w-0">
                        <span className="block truncate">{page.title ?? book('untitled')}</span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {formatPageDate(new Date(page.updatedAt), today, timeZone, locale)}
                          {page.excerpt === '' ? '' : ` · ${page.excerpt}`}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
                {visible.length === 0 && (
                  <li className="px-3 py-2.5 text-muted-foreground">{t('pages.none')}</li>
                )}
              </ul>
              <p className="px-1 text-sm text-muted-foreground">
                {t('pages.selected', { count: selected.length })}
              </p>
            </div>
          )}
        </Group>
      )}

      <Group legend={t('duration.legend')}>
        <div className="grid grid-cols-2 gap-2">
          {durationChoices.map((candidate) => (
            <Choice
              key={candidate}
              name={`${id}-duration`}
              checked={choice === candidate}
              onSelect={() => {
                setChoice(candidate)
              }}
              label={t(`duration.${candidate}`)}
            />
          ))}
        </div>
        {choice === 'until' && (
          <label className="block space-y-1.5 pt-1">
            <span className="block px-1 text-sm text-muted-foreground">{t('duration.date')}</span>
            <input
              type="date"
              value={until}
              min={firstDayToChoose(today, timeZone)}
              onChange={(event) => {
                setUntil(event.target.value)
              }}
              className="h-12 w-full rounded-[12px] bg-background/70 px-4 text-base outline-none focus:ring-2 focus:ring-foreground/25"
            />
          </label>
        )}
      </Group>

      <p
        aria-live="polite"
        className="rounded-[16px] bg-background/70 px-4 py-3.5 leading-relaxed text-pretty"
      >
        {problem ?? sentence}
      </p>

      <ActionError error={error} />
      <div className="flex flex-wrap gap-3">
        <Button shape="pill" disabled={problem !== null || pending} onClick={confirm}>
          {pending ? t('submitting') : t('submit')}
        </Button>
        <Button shape="pill" variant="ghost" disabled={pending} onClick={onClose}>
          {t('cancel')}
        </Button>
      </div>
    </div>
  )
}

export function ShareFlow({ initiallyOpen, hasShares, ...props }: ShareFlowProps) {
  const t = useTranslations('mybook.sharing.flow')
  const [open, setOpen] = useState(initiallyOpen)

  if (!open) {
    return (
      <Button
        shape="pill"
        size="sm"
        variant={hasShares ? 'outline' : 'default'}
        onClick={() => {
          setOpen(true)
        }}
      >
        {hasShares ? t('openMore') : t('open')}
      </Button>
    )
  }

  return (
    <ShareForm
      {...props}
      onClose={() => {
        setOpen(false)
      }}
    />
  )
}
