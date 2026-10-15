'use client'

import type { PatientInsight } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { Chevron, DisclosurePanel } from '@/shared/components/disclosure'
import { Section } from '@/shared/components/section'
import { useLocationHash } from '@/shared/hooks/use-location-hash'
import { readingAnchor, readingIdOfHash, type PeriodLabeled } from '../readings'
import { EarlierReadings } from './earlier-readings'
import { ReadingContent } from './reading-content'

interface ReadingDigestProps {
  latest: PeriodLabeled<PatientInsight>
  teaser: string
  earlier: readonly PeriodLabeled<PatientInsight>[]
}

export function ReadingDigest({ latest: labeled, teaser, earlier }: ReadingDigestProps) {
  const t = useTranslations('insights.patient')
  const { reading: latest, period } = labeled
  const panelId = useId()
  const hash = useLocationHash()
  const targeted = readingIdOfHash(hash)
  const [toggled, setToggled] = useState<{ open: boolean; hash: string } | null>(null)
  const linked =
    targeted !== null && [labeled, ...earlier].some(({ reading }) => reading.id === targeted)
  const open = toggled !== null && toggled.hash === hash ? toggled.open : linked

  return (
    <Section title={t('digest')}>
      <article id={readingAnchor(latest.id)} className="scroll-mt-6 space-y-3">
        <p className="text-sm text-muted-foreground">
          {t('period', { period, count: latest.checkInCount })}
        </p>
        {!open && (
          <p className="max-w-xl font-serif text-[19px] leading-[1.5] text-pretty">{teaser}</p>
        )}
        <div>
          <DisclosurePanel id={panelId} open={open} keepMounted className="space-y-6 pt-1 pb-3">
            <ReadingContent content={latest.content} />
            {earlier.length > 0 && <EarlierReadings readings={earlier} />}
          </DisclosurePanel>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => {
              setToggled({ open: !open, hash })
            }}
            className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-sm underline decoration-1 underline-offset-4"
          >
            {open ? t('close') : t('open')}
            <Chevron open={open} />
          </button>
        </div>
      </article>
    </Section>
  )
}
