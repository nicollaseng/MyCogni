'use client'

import { crisisLinesFor } from '@mycogni/domain'
import Link from 'next/link'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { Sheet } from '@/shared/components/sheet'
import { Button } from '@/shared/ui/button'
import { BreathingExercise } from './breathing-exercise'

export function HelpNow({ professionals }: { professionals: readonly string[] }) {
  const t = useTranslations('zen.help')
  const safety = useTranslations('safety')
  const format = useFormatter()
  const lines = crisisLinesFor(useLocale())
  const [open, setOpen] = useState(false)
  const [breathing, setBreathing] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setBreathing(false)
          setOpen(true)
        }}
        className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-help transition-colors duration-150 hover:bg-mist motion-reduce:transition-none"
      >
        {t('open')}
      </button>
      {open && (
        <Sheet
          title={t('title')}
          closeLabel={t('close')}
          onClose={() => {
            setOpen(false)
          }}
        >
          {() => (
            <div className="space-y-6 overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6">
              {breathing ? (
                <BreathingExercise />
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-[15px]">{t('call')}</p>
                    <ul className="space-y-2">
                      {lines.map((line) => (
                        <li key={line.phone}>
                          <a
                            href={`tel:${line.phone}`}
                            className="flex min-h-14 items-center gap-4 rounded-lg bg-surface px-4 transition-colors duration-150 hover:bg-sage motion-reduce:transition-none"
                          >
                            <span className="font-serif text-[26px] leading-none tabular-nums">
                              {line.display}
                            </span>
                            <span className="text-sm leading-snug text-muted-foreground">
                              {line.description}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {professionals.length > 0 && (
                    <p className="text-[15px] text-muted-foreground">
                      {safety('professionals', {
                        count: professionals.length,
                        names: format.list(professionals),
                      })}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setBreathing(true)
                      }}
                    >
                      {t('breathe')}
                    </Button>
                    <Link
                      href="/zen/topics/help"
                      className="text-[15px] underline decoration-1 underline-offset-4"
                    >
                      {t('more')}
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </Sheet>
      )}
    </>
  )
}
