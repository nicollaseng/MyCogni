'use client'

import {
  ambientSoundIds,
  contentLanguageOf,
  narrationSpeeds,
  voiceFor,
  voicesFor,
  type AmbientScope,
  type AmbientSoundId,
  type NarrationVoiceId,
} from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useRef, useState } from 'react'
import { Panel, Section } from '@/shared/components/section'
import { useAmbient } from '../ambient-provider'
import { saveAudioPreferences, useAudioPreferences } from '../preferences'
import { ChoiceGroup } from './choice-group'

interface SoundAndVoiceSettingsProps {
  previews: Partial<Record<NarrationVoiceId, string>>
}

const selectStyles =
  'min-h-11 w-full cursor-pointer rounded-md border border-rule bg-transparent px-4 text-[15px]'

const previewStyles =
  '-mr-3 inline-flex h-11 shrink-0 items-center rounded-md px-3 text-[15px] underline decoration-1 underline-offset-4 hover:bg-sage'

const scopes: readonly AmbientScope[] = ['zen', 'app', 'off']

function VoiceRow({ previews }: SoundAndVoiceSettingsProps) {
  const t = useTranslations('audio.settings')
  const language = contentLanguageOf(useLocale())
  const preferences = useAudioPreferences()
  const voice = voiceFor(language, preferences.voice)
  const sample = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const id = useId()
  const url = previews[voice]

  return (
    <div className="space-y-2">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm text-muted-foreground">
          {t('voice')}
        </label>
        {url !== undefined && (
          <>
            <audio
              ref={sample}
              src={url}
              preload="none"
              onPlay={() => {
                setPlaying(true)
              }}
              onPause={() => {
                setPlaying(false)
              }}
              onEnded={() => {
                setPlaying(false)
              }}
            />
            <button
              type="button"
              onClick={() => {
                const element = sample.current
                if (element === null) {
                  return
                }
                if (element.paused) {
                  element.currentTime = 0
                  void element.play().catch(() => {
                    setPlaying(false)
                  })
                } else {
                  element.pause()
                }
              }}
              className={previewStyles}
            >
              {playing ? t('stop') : t('sample')}
            </button>
          </>
        )}
      </div>
      <select
        id={id}
        value={voice}
        onChange={(event) => {
          const next = voicesFor(language).find(
            ({ id: option }) => option === event.currentTarget.value,
          )
          if (next !== undefined) {
            sample.current?.pause()
            saveAudioPreferences({ voice: next.id })
          }
        }}
        className={selectStyles}
      >
        {voicesFor(language).map((option) => (
          <option key={option.id} value={option.id}>
            {t('voiceOption', {
              name: option.name,
              gender: option.gender,
              tone: t(`tones.${option.tone}`),
            })}
          </option>
        ))}
      </select>
    </div>
  )
}

function SoundRow() {
  const t = useTranslations('audio')
  const preferences = useAudioPreferences()
  const { preview, previewing } = useAmbient()
  const id = useId()

  return (
    <div className="space-y-2">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm text-muted-foreground">
          {t('settings.sound')}
        </label>
        {preferences.sound !== 'none' && (
          <button
            type="button"
            onClick={() => {
              preview(preferences.sound)
            }}
            className={previewStyles}
          >
            {previewing === preferences.sound ? t('settings.stop') : t('settings.listen')}
          </button>
        )}
      </div>
      <select
        id={id}
        value={preferences.sound}
        onChange={(event) => {
          const next = ambientSoundIds.find((sound) => sound === event.currentTarget.value)
          if (next !== undefined) {
            saveAudioPreferences({ sound: next })
          }
        }}
        className={selectStyles}
      >
        {ambientSoundIds.map((sound: AmbientSoundId) => (
          <option key={sound} value={sound}>
            {t(`ambient.sounds.${sound}`)}
          </option>
        ))}
      </select>
    </div>
  )
}

function VolumeRow() {
  const t = useTranslations('audio.settings')
  const preferences = useAudioPreferences()
  const id = useId()
  const percent = Math.round(preferences.volume * 100)

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm text-muted-foreground">
          {t('volume')}
        </label>
        <span className="text-sm tabular-nums">{t('percent', { percent })}</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        aria-valuetext={t('percent', { percent })}
        onChange={(event) => {
          saveAudioPreferences({ volume: Number(event.currentTarget.value) / 100 })
        }}
        className="audio-range"
      />
    </div>
  )
}

export function SoundAndVoiceSettings({ previews }: SoundAndVoiceSettingsProps) {
  const t = useTranslations('audio.settings')
  const preferences = useAudioPreferences()
  const ambientOn = preferences.scope !== 'off' && preferences.sound !== 'none'

  return (
    <Section title={t('title')}>
      <Panel className="space-y-6 py-5">
        <VoiceRow previews={previews} />
        <ChoiceGroup
          label={t('speed')}
          value={String(preferences.speed)}
          choices={narrationSpeeds.map((speed) => ({
            value: String(speed),
            label: t(`speeds.${speed === 1 ? 'normal' : speed < 1 ? 'slower' : 'faster'}`),
          }))}
          onChange={(value) => {
            const next = narrationSpeeds.find((speed) => String(speed) === value)
            if (next !== undefined) {
              saveAudioPreferences({ speed: next })
            }
          }}
        />
        <ChoiceGroup
          label={t('where')}
          value={preferences.scope}
          choices={scopes.map((scope) => ({ value: scope, label: t(`scopes.${scope}`) }))}
          onChange={(scope) => {
            saveAudioPreferences({ scope })
          }}
        />
        {preferences.scope !== 'off' && <SoundRow />}
        {ambientOn && <VolumeRow />}
      </Panel>
      <p className="text-sm text-pretty text-muted-foreground">{t('device')}</p>
    </Section>
  )
}
