'use client'

import type { PatientInsight } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { Chevron, DisclosurePanel } from '@/shared/components/disclosure'
import { Panel } from '@/shared/components/section'
import { useLocationHash } from '@/shared/hooks/use-location-hash'
import { readingAnchor, readingIdOfHash, type PeriodLabeled } from '../readings'
import { ReadingContent } from './reading-content'

interface EarlierReadingProps {
  reading: PatientInsight
  period: string
  open: boolean
  onToggle: () => void
}

function EarlierReading({ reading, period, open, onToggle }: EarlierReadingProps) {
  const t = useTranslations('insights.patient')
  const panelId = useId()

  return (
    <li id={readingAnchor(reading.id)} className="scroll-mt-6">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-3.5 text-left"
      >
        <span className="min-w-0">
          <span className="block">{period}</span>
          <span className="block text-sm text-muted-foreground">
            {t('records', { count: reading.checkInCount })}
          </span>
        </span>
        <Chevron open={open} className="text-muted-foreground" />
      </button>
      <DisclosurePanel id={panelId} open={open} className="pt-1 pb-6">
        <ReadingContent content={reading.content} headingLevel={4} />
      </DisclosurePanel>
    </li>
  )
}

export function EarlierReadings({
  readings,
}: {
  readings: readonly PeriodLabeled<PatientInsight>[]
}) {
  const t = useTranslations('insights.patient')
  const targeted = readingIdOfHash(useLocationHash())
  const [toggled, setToggled] = useState<Readonly<Record<string, boolean>>>({})
  const isOpen = (id: string) => toggled[id] ?? id === targeted

  return (
    <div className="space-y-3 pt-4">
      <h3 className="text-sm text-muted-foreground">{t('earlier')}</h3>
      <Panel className="py-1">
        <ul>
          {readings.map(({ reading, period }) => (
            <EarlierReading
              key={reading.id}
              reading={reading}
              period={period}
              open={isOpen(reading.id)}
              onToggle={() => {
                setToggled({ ...toggled, [reading.id]: !isOpen(reading.id) })
              }}
            />
          ))}
        </ul>
      </Panel>
    </div>
  )
}
