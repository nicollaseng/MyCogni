'use client'

import { useTranslations } from 'next-intl'
import type { RecordPractice, RememberFeeling } from '../practice/record'
import { BreathingExercise } from './breathing-exercise'
import { ZenOverlay, zenOverlayDuration } from './zen-overlay'

export const breathingModeDuration = zenOverlayDuration

interface BreathingModeProps {
  onClose: () => void
  record?: RecordPractice
  remember?: RememberFeeling
}

export function BreathingMode({ onClose, record, remember }: BreathingModeProps) {
  const t = useTranslations('zen.breathing')

  return (
    <ZenOverlay title={t('title')} closeLabel={t('close')} onClose={onClose}>
      {(close) => <BreathingExercise onClose={close} record={record} remember={remember} />}
    </ZenOverlay>
  )
}
