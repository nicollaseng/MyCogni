'use client'

import type { DataExport } from '@mycogni/contracts'
import { isActiveExport } from '@mycogni/domain'
import { useFormatter, useTranslations } from 'next-intl'
import { useEffect, useState, useTransition } from 'react'
import { Panel } from '@/shared/components/section'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'

export interface DataExportActions {
  prepare: () => Promise<ActionResult<DataExport>>
  latest: () => Promise<DataExport | null>
  download: (id: string) => Promise<ActionResult<string>>
}

interface DataExportPanelProps {
  initial: DataExport | null
  timeZone: string
  now: string
  actions: DataExportActions
  pollMs?: number
  open?: (url: string) => void
}

function openInPlace(url: string): void {
  window.location.assign(url)
}

export function DataExportPanel({
  initial,
  timeZone,
  now,
  actions,
  pollMs = 5000,
  open = openInPlace,
}: DataExportPanelProps) {
  const t = useTranslations('exports')
  const format = useFormatter()
  const [current, setCurrent] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const preparing = current !== null && isActiveExport(current.status)
  const sizeOf = (bytes: number) =>
    bytes < 1_000_000
      ? format.number(Math.max(1, Math.round(bytes / 1000)), { style: 'unit', unit: 'kilobyte' })
      : format.number(bytes / 1_000_000, {
          style: 'unit',
          unit: 'megabyte',
          maximumFractionDigits: 1,
        })
  const ready =
    current?.status === 'ready' &&
    current.expiresAt !== null &&
    new Date(current.expiresAt).getTime() > new Date(now).getTime()

  useEffect(() => {
    if (!preparing) {
      return undefined
    }
    const refresh = () => {
      void actions.latest().then((latest) => {
        if (latest !== null) {
          setCurrent(latest)
        }
      })
    }
    const timer = window.setInterval(refresh, pollMs)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [preparing, actions, pollMs])

  function prepare() {
    setError(null)
    startTransition(async () => {
      const result = await actions.prepare()
      if (result.ok) {
        setCurrent(result.value)
      } else {
        setError(result.error)
      }
    })
  }

  function download(id: string) {
    setError(null)
    startTransition(async () => {
      const result = await actions.download(id)
      if (result.ok) {
        open(result.value)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Panel className="space-y-3 py-4">
      {preparing ? (
        <p role="status" className="text-[15px]">
          {t('preparing')}
        </p>
      ) : ready ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-[15px]">
            {t('ready', {
              size: sizeOf(current.sizeBytes ?? 0),
              date: format.dateTime(new Date(current.expiresAt ?? 0), {
                day: 'numeric',
                month: 'short',
                timeZone,
              }),
            })}
          </p>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => {
              download(current.id)
            }}
          >
            {t('download')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {current !== null && (
            <p role="status" className="text-[15px]">
              {t(current.status === 'failed' ? 'failed' : 'expired')}
            </p>
          )}
          <Button size="sm" variant="outline" disabled={pending} onClick={prepare}>
            {current === null ? t('prepare') : t('again')}
          </Button>
        </div>
      )}
      {!ready && <p className="text-sm text-pretty text-muted-foreground">{t('hint')}</p>}
      {error !== null && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Panel>
  )
}
