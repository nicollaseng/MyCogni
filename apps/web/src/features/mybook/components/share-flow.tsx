'use client'

import type { CreateJournalShareInput, JournalEntrySummary } from '@mycogni/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useState, type ReactNode } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { cn } from '@/shared/lib/utils'
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
import { Sheet } from './sheet'

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

type ShareFormProps = Omit<ShareFlowProps, 'initiallyOpen' | 'hasShares'> & {
  onClose: () => void
}

const scopes: readonly Scope[] = ['entries', 'all']

const control = 'size-4 shrink-0 accent-primary'

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="mb-3 text-sm font-medium">{legend}</legend>
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
}: ShareFormProps) {
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
  const visible = matchingPages(pages, query)

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 pt-1 pb-8 sm:px-6">
        <Group legend={t('scope.legend')}>
          <div className="grid grid-cols-2 gap-1 rounded-[6px] bg-surface p-1">
            {scopes.map((candidate) => (
              <label
                key={candidate}
                className="flex cursor-pointer items-center justify-center rounded-[4px] px-2 py-2 text-center text-[15px] text-muted-foreground transition-colors duration-150 has-[:checked]:bg-background has-[:checked]:text-foreground has-[:checked]:shadow-[0_1px_2px_rgb(0_0_0/0.06)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-foreground motion-reduce:transition-none"
              >
                <input
                  type="radio"
                  name={`${id}-scope`}
                  checked={scope === candidate}
                  onChange={() => {
                    setScope(candidate)
                  }}
                  className="sr-only"
                />
                {t(`scope.${candidate}`)}
              </label>
            ))}
          </div>
          {scope === 'all' && (
            <p className="text-sm leading-relaxed text-muted-foreground">{t('scope.allHint')}</p>
          )}
        </Group>

        {scope === 'entries' && (
          <Group legend={t('pages.legend')}>
            {pages.length === 0 ? (
              <p className="text-muted-foreground">{t('pages.empty')}</p>
            ) : (
              <>
                <SearchField
                  label={t('pages.search')}
                  placeholder={t('pages.search')}
                  initial=""
                  delay={0}
                  onSearch={setQuery}
                />
                <ul className="-mx-2 space-y-0.5">
                  {visible.map((page) => (
                    <li key={page.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-[6px] px-2 py-2.5 transition-colors duration-150 hover:bg-surface motion-reduce:transition-none">
                        <input
                          type="checkbox"
                          checked={selected.includes(page.id)}
                          onChange={() => {
                            toggle(page.id)
                          }}
                          className={cn(control, 'mt-1')}
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
                    <li className="px-2 py-2.5 text-muted-foreground">{t('pages.none')}</li>
                  )}
                </ul>
                <p className="text-sm text-muted-foreground">
                  {t('pages.selected', { count: selected.length })}
                </p>
              </>
            )}
          </Group>
        )}

        <Group legend={t('duration.legend')}>
          <div className="space-y-0.5">
            {durationChoices.map((candidate) => (
              <label key={candidate} className="flex cursor-pointer items-center gap-3 py-2">
                <input
                  type="radio"
                  name={`${id}-duration`}
                  checked={choice === candidate}
                  onChange={() => {
                    setChoice(candidate)
                  }}
                  className={control}
                />
                {t(`duration.${candidate}`)}
              </label>
            ))}
          </div>
          {choice === 'until' && (
            <input
              type="date"
              aria-label={t('duration.date')}
              value={until}
              min={firstDayToChoose(today, timeZone)}
              onChange={(event) => {
                setUntil(event.target.value)
              }}
              className="h-12 w-full rounded-[6px] border border-rule bg-white/60 px-4 text-base outline-none focus:border-foreground dark:bg-white/5"
            />
          )}
        </Group>
      </div>

      <div className="space-y-4 border-t border-rule px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
        <p
          aria-live="polite"
          className={cn('leading-relaxed text-pretty', problem !== null && 'text-muted-foreground')}
        >
          {problem ?? sentence}
        </p>
        <ActionError error={error} />
        <div className="flex flex-wrap gap-3">
          <Button disabled={problem !== null || pending} onClick={confirm}>
            {pending ? t('submitting') : t('submit')}
          </Button>
          <Button variant="ghost" disabled={pending} onClick={onClose}>
            {t('cancel')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ShareFlow({ initiallyOpen, hasShares, ...props }: ShareFlowProps) {
  const t = useTranslations('mybook.sharing.flow')
  const [open, setOpen] = useState(initiallyOpen)

  return (
    <>
      <Button
        size="sm"
        variant={hasShares ? 'outline' : 'default'}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true)
        }}
      >
        {hasShares ? t('openMore') : t('open')}
      </Button>
      {open && (
        <Sheet
          title={t('title', { name: props.name })}
          closeLabel={t('close')}
          onClose={() => {
            setOpen(false)
            if (initiallyOpen) {
              window.history.replaceState(null, '', window.location.pathname)
            }
          }}
        >
          {(close) => <ShareForm {...props} onClose={close} />}
        </Sheet>
      )}
    </>
  )
}
