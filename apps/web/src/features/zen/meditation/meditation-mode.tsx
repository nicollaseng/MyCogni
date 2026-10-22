'use client'

import { useTranslations } from 'next-intl'
import { ZenOverlay } from '../components/zen-overlay'
import {
  recordPractice,
  rememberFeeling,
  type RecordPractice,
  type RememberFeeling,
} from '../practice/record'
import { MeditationPlayer } from './meditation-player'
import type { MeditationOption } from './options'

interface MeditationModeProps {
  option: MeditationOption
  onClose: () => void
  record?: RecordPractice
  remember?: RememberFeeling
}

export function MeditationMode({
  option,
  onClose,
  record = recordPractice,
  remember = rememberFeeling,
}: MeditationModeProps) {
  const t = useTranslations('zen.meditations')

  return (
    <ZenOverlay title={option.title} closeLabel={t('close')} onClose={onClose}>
      {(close) => (
        <MeditationPlayer option={option} onClose={close} record={record} remember={remember} />
      )}
    </ZenOverlay>
  )
}
