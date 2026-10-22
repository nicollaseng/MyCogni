import { assistantLimits } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type SubmitEvent } from 'react'
import { useAmbient } from '@/features/audio/ambient-provider'
import { ArrowUpIcon, MicIcon } from '@/shared/components/icons'
import { RoundButton } from '../voice/round-button'
import { transcribeRecording, type Transcribe } from '../voice/transcribe'
import { useVoiceInput, type VoiceIntent } from '../voice/use-voice-input'
import { VoiceBar } from '../voice/voice-bar'
import { browserVoiceMedia, type VoiceMedia } from '../voice/voice-media'

interface ChatComposerProps {
  pending: boolean
  onSend: (text: string) => Promise<boolean>
  notes: readonly string[]
  voice?: boolean
  media?: VoiceMedia
  transcribe?: Transcribe
}

const nearLimit = 100

function joined(typed: string, spoken: string): string {
  return typed.trim() === '' ? spoken : `${typed.trimEnd()} ${spoken}`
}

export function ChatComposer({
  pending,
  onSend,
  notes,
  voice: voiceEnabled = false,
  media = browserVoiceMedia,
  transcribe = transcribeRecording,
}: ChatComposerProps) {
  const t = useTranslations('assistant.composer')
  const tv = useTranslations('voice')
  const id = useId()
  const form = useRef<HTMLFormElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  const mic = useRef<HTMLButtonElement>(null)
  const [text, setText] = useState('')
  const [focus, setFocus] = useState<'field' | 'mic' | null>(null)
  const { duck } = useAmbient()
  const max = assistantLimits.messageLength
  const showCount = max - text.length <= nearLimit

  async function deliver(value: string): Promise<void> {
    setText('')
    if (!(await onSend(value))) {
      setText(value)
    }
  }

  function onText(spoken: string, intent: VoiceIntent): void {
    const value = joined(text, spoken).slice(0, max)
    if (intent === 'send') {
      void deliver(value)
    } else {
      setText(value)
    }
    setFocus('field')
  }

  const voice = useVoiceInput({ media, transcribe, onText, duck })
  const active = voice.status === 'recording' || voice.status === 'transcribing'
  const showMic = voiceEnabled && voice.supported
  const announcement =
    voice.status === 'recording'
      ? tv('recording')
      : voice.status === 'transcribing'
        ? tv('transcribing')
        : voice.notice === null
          ? ''
          : tv(`notices.${voice.notice}`)
  const canSend = voice.status === 'recording' || (!pending && !active && text.trim() !== '')

  useEffect(() => {
    if (focus === 'field' && field.current !== null) {
      const end = field.current.value.length
      field.current.focus()
      field.current.setSelectionRange(end, end)
    }
    if (focus === 'mic') {
      mic.current?.focus()
    }
  }, [focus])

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (voice.status === 'recording') {
      await voice.finish('send')
      return
    }
    const value = text
    if (value.trim() === '' || pending || active) {
      return
    }
    await deliver(value)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      form.current?.requestSubmit()
    }
  }

  return (
    <form ref={form} onSubmit={(event) => void submit(event)} className="space-y-1.5">
      <label htmlFor={id} className="sr-only">
        {t('label')}
      </label>
      <div className="flex items-end gap-2">
        {active ? (
          <VoiceBar
            voice={{
              ...voice,
              cancel: () => {
                voice.cancel()
                setFocus('mic')
              },
            }}
          />
        ) : (
          <>
            <textarea
              ref={field}
              id={id}
              rows={1}
              value={text}
              maxLength={max}
              placeholder={t('placeholder')}
              aria-describedby={`${id}-note`}
              onChange={(event) => {
                setText(event.target.value)
                setFocus(null)
              }}
              onKeyDown={onKeyDown}
              className="max-h-36 min-h-12 min-w-0 flex-1 resize-none rounded-[6px] border border-rule bg-background px-3.5 py-3 text-base leading-snug outline-none field-sizing-content placeholder:text-muted-foreground focus:border-foreground"
            />
            {showMic && (
              <RoundButton
                ref={mic}
                label={tv('speak')}
                className="size-12"
                disabled={pending || voice.status === 'opening'}
                onClick={() => {
                  setFocus(null)
                  void voice.start()
                }}
              >
                <MicIcon className="size-5" />
              </RoundButton>
            )}
          </>
        )}
        <RoundButton
          type="submit"
          tone="accent"
          label={t('send')}
          className="size-12"
          disabled={!canSend}
        >
          <ArrowUpIcon className="size-5" />
        </RoundButton>
      </div>
      <p aria-live="polite" data-testid="voice-announcer" className="sr-only">
        {announcement}
      </p>
      {voice.notice !== null && !active && (
        <p data-testid="voice-notice" className="text-sm text-pretty text-muted-foreground">
          {tv(`notices.${voice.notice}`)}
        </p>
      )}
      {showCount && (
        <p aria-live="polite" className="text-right text-xs text-muted-foreground tabular-nums">
          {t('count', { count: text.length, max })}
        </p>
      )}
      <p
        id={`${id}-note`}
        className="text-center text-[9px] leading-snug text-pretty text-muted-foreground"
      >
        {notes.map((line, index) => (
          <span key={line} className="block">
            {index > 0 ? ` ${line}` : line}
          </span>
        ))}
      </p>
    </form>
  )
}
