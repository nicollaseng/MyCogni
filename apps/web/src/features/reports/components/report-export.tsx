'use client'

import { moodReportPeriods, type MoodReportPeriod } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
import { useId, useState, type ReactNode } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { DownloadIcon } from '@/shared/components/icons'
import { Sheet } from '@/shared/components/sheet'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Switch } from '@/shared/ui/switch'
import { downloadReport, type DownloadReport } from '../download'

export type ReportAudience = 'patient' | 'professional'

interface ReportExportProps {
  href: string
  audience: ReportAudience
  summaries: boolean
  name?: string
  triggerClassName?: string
  download?: DownloadReport
}

interface ReportFormProps {
  href: string
  audience: ReportAudience
  summaries: boolean
  name: string
  download: DownloadReport
  onClose: () => void
}

const defaultPeriod: MoodReportPeriod = 30

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-sm font-medium">{legend}</legend>
      {children}
    </fieldset>
  )
}

interface ToggleProps {
  label: string
  hint: string
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
}

function Toggle({ label, hint, checked, disabled, onChange }: ToggleProps) {
  const hintId = useId()
  return (
    <div className="flex items-start justify-between gap-6 py-2.5">
      <div className="space-y-1">
        <p className="leading-snug">{label}</p>
        <p id={hintId} className="text-sm leading-relaxed text-pretty text-muted-foreground">
          {hint}
        </p>
      </div>
      <div className="pt-0.5">
        <Switch
          checked={checked}
          label={label}
          describedBy={hintId}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
    </div>
  )
}

function ReportForm({ href, audience, summaries, name, download, onClose }: ReportFormProps) {
  const t = useTranslations('report')
  const id = useId()
  const [days, setDays] = useState<MoodReportPeriod>(defaultPeriod)
  const [notes, setNotes] = useState(false)
  const [reading, setReading] = useState(summaries)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setPending(true)
    setError(null)
    const done = await download(href, { days, notes, reading }).catch(() => false)
    setPending(false)
    if (done) {
      onClose()
    } else {
      setError(t('error'))
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 pt-1 pb-8 sm:px-6">
        <p className="leading-relaxed text-pretty text-muted-foreground">
          {t(`${audience}.description`, { name })}
        </p>
        <Group legend={t('period')}>
          <div className="grid grid-cols-2 gap-1 rounded-[6px] bg-surface p-1">
            {moodReportPeriods.map((period) => (
              <label
                key={period}
                className="flex cursor-pointer items-center justify-center rounded-[4px] px-2 py-2 text-center text-[15px] text-muted-foreground transition-colors duration-150 has-[:checked]:bg-background has-[:checked]:text-foreground has-[:checked]:shadow-[0_1px_2px_rgb(0_0_0/0.06)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-foreground motion-reduce:transition-none"
              >
                <input
                  type="radio"
                  name={`${id}-period`}
                  checked={days === period}
                  disabled={pending}
                  onChange={() => {
                    setDays(period)
                  }}
                  className="sr-only"
                />
                {t('days', { days: period })}
              </label>
            ))}
          </div>
        </Group>
        <Group legend={t('content')}>
          <div className="-my-2.5">
            <Toggle
              label={t(`${audience}.notes`)}
              hint={t(`${audience}.notesHint`)}
              checked={notes}
              disabled={pending}
              onChange={setNotes}
            />
            {summaries && (
              <Toggle
                label={t('reading')}
                hint={t('readingHint')}
                checked={reading}
                disabled={pending}
                onChange={setReading}
              />
            )}
          </div>
        </Group>
      </div>

      <div className="space-y-4 border-t border-rule px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
        <p aria-live="polite" className="leading-relaxed text-pretty">
          {t(`${audience}.summary`, {
            days,
            notes: String(notes),
            reading: String(summaries && reading),
          })}
        </p>
        <ActionError error={error} />
        <div className="flex flex-wrap gap-3">
          <Button disabled={pending} onClick={() => void submit()}>
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

export function ReportExport({
  href,
  audience,
  summaries,
  name = '',
  triggerClassName,
  download = downloadReport,
}: ReportExportProps) {
  const t = useTranslations('report')
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        aria-haspopup="dialog"
        className={cn('gap-2', triggerClassName)}
        onClick={() => {
          setOpen(true)
        }}
      >
        <DownloadIcon className="size-4" />
        {t(`${audience}.open`)}
      </Button>
      {open && (
        <Sheet
          title={t(`${audience}.title`)}
          closeLabel={t('close')}
          onClose={() => {
            setOpen(false)
          }}
        >
          {(close) => (
            <ReportForm
              href={href}
              audience={audience}
              summaries={summaries}
              name={name}
              download={download}
              onClose={close}
            />
          )}
        </Sheet>
      )}
    </>
  )
}
