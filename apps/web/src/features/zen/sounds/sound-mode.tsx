'use client'

import type { SoundProgrammeId } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ZenOverlay } from '../components/zen-overlay'
import { recordPractice, type RecordPractice } from '../practice/record'
import { createFrequencyEngine, type FrequencyEngine } from './frequency-engine'
import { SoundPlayer } from './sound-player'

interface SoundModeProps {
  programme: SoundProgrammeId
  onClose: () => void
  engine?: () => FrequencyEngine
  record?: RecordPractice
}

export function SoundMode({
  programme,
  onClose,
  engine = createFrequencyEngine,
  record = recordPractice,
}: SoundModeProps) {
  const t = useTranslations('zen.sounds')
  const [player] = useState(engine)

  return (
    <ZenOverlay title={t(`names.${programme}`)} closeLabel={t('close')} onClose={onClose}>
      {(close) => (
        <SoundPlayer programme={programme} engine={player} record={record} onClose={close} />
      )}
    </ZenOverlay>
  )
}
