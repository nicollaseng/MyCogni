import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { AmbientRoot } from '@/features/audio/ambient-provider'
import { fakeEngine } from '@/test/ambient'
import { renderWithIntl } from '@/test/render'
import type { Transcribe, TranscribeResult } from '../voice/transcribe'
import { MicrophoneDeniedError, type VoiceCapture, type VoiceMedia } from '../voice/voice-media'
import { ChatComposer } from './chat-composer'

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
}

function deferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function fakeMedia({ supported = true, refuse = false } = {}) {
  const capture = {
    level: jest.fn(() => 0.6),
    finish: jest.fn(() => Promise.resolve(new Blob(['voz'], { type: 'audio/webm' }))),
    discard: jest.fn(),
  } satisfies VoiceCapture
  const media = {
    supported: () => supported,
    open: jest.fn(() =>
      refuse ? Promise.reject(new MicrophoneDeniedError()) : Promise.resolve(capture),
    ),
  } satisfies VoiceMedia
  return { media, capture }
}

function preferReducedMotion(): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  })
}

const spoken: TranscribeResult = { ok: true, text: 'Dormi mal hoje' }

interface Setup {
  voice?: boolean
  media?: VoiceMedia
  transcribe?: Transcribe
  wrap?: (children: ReactNode) => ReactNode
}

function setup({ voice = true, media, transcribe, wrap = (children) => children }: Setup = {}) {
  const user = userEvent.setup()
  const onSend = jest.fn<(text: string) => Promise<boolean>>(() => Promise.resolve(true))
  const outer = jest.fn()
  const view = renderWithIntl(
    <>
      {wrap(
        <div onKeyDown={outer}>
          <ChatComposer
            pending={false}
            onSend={onSend}
            notes={[]}
            voice={voice}
            media={media ?? fakeMedia().media}
            transcribe={transcribe ?? (() => Promise.resolve(spoken))}
          />
        </div>,
      )}
    </>,
  )
  return { user, onSend, outer, ...view }
}

function field(): HTMLTextAreaElement {
  return screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Mensagem' })
}

describe('ChatComposer voice input', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia')
    window.localStorage.clear()
    Reflect.deleteProperty(window.navigator, 'userActivation')
  })

  it('offers the microphone next to a round send button only when voice is available', () => {
    const { unmount } = setup()

    expect(screen.getByRole('button', { name: 'Falar' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
    unmount()

    setup({ voice: false })
    expect(screen.queryByRole('button', { name: 'Falar' })).not.toBeInTheDocument()
  })

  it('hides the microphone where the browser cannot record', () => {
    setup({ media: fakeMedia({ supported: false }).media })

    expect(screen.queryByRole('button', { name: 'Falar' })).not.toBeInTheDocument()
  })

  it('records with a live waveform, then puts the text in the field to review', async () => {
    const answer = deferred<TranscribeResult>()
    const { media, capture } = fakeMedia()
    const { user, onSend } = setup({ media, transcribe: () => answer.promise })

    await user.type(field(), 'Oi.')
    await user.click(screen.getByRole('button', { name: 'Falar' }))

    const bar = screen.getByRole('group', { name: 'Gravando' })
    expect(bar).toBeVisible()
    expect(screen.getByTestId('voice-waveform')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar gravação' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Parar e revisar' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled()
    expect(screen.getByTestId('voice-announcer')).toHaveTextContent('Gravando')
    expect(screen.queryByRole('textbox', { name: 'Mensagem' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Parar e revisar' }))

    expect(within(bar).getByText('Transcrevendo…')).toBeVisible()
    expect(screen.getByTestId('voice-announcer')).toHaveTextContent('Transcrevendo…')
    expect(capture.finish).toHaveBeenCalled()
    await act(async () => {
      answer.resolve(spoken)
      await answer.promise
    })

    expect(field()).toHaveValue('Oi. Dormi mal hoje')
    expect(field()).toHaveFocus()
    expect(field().selectionStart).toBe('Oi. Dormi mal hoje'.length)
    expect(onSend).not.toHaveBeenCalled()

    await user.type(field(), ' e acordei cedo{Enter}')
    expect(onSend).toHaveBeenCalledWith('Oi. Dormi mal hoje e acordei cedo')
  })

  it('sends straight away from the recording with the send arrow', async () => {
    const { user, onSend } = setup()

    await user.click(screen.getByRole('button', { name: 'Falar' }))
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith('Dormi mal hoje')
    })
    expect(field()).toHaveValue('')
  })

  it('throws the recording away on cancel and on Escape, without closing what is around it', async () => {
    const { media, capture } = fakeMedia()
    const { user, onSend, outer } = setup({ media })

    await user.click(screen.getByRole('button', { name: 'Falar' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar gravação' }))

    expect(capture.discard).toHaveBeenCalledTimes(1)
    expect(field()).toBeVisible()
    expect(screen.getByRole('button', { name: 'Falar' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Falar' }))
    outer.mockClear()
    await user.keyboard('{Escape}')

    expect(capture.discard).toHaveBeenCalledTimes(2)
    expect(outer).not.toHaveBeenCalled()
    expect(field()).toBeVisible()
    expect(onSend).not.toHaveBeenCalled()
  })

  it('asks calmly for the microphone when it is refused and keeps typing possible', async () => {
    const { user } = setup({ media: fakeMedia({ refuse: true }).media })

    await user.click(screen.getByRole('button', { name: 'Falar' }))

    expect(screen.getByTestId('voice-notice')).toHaveTextContent(
      'Permita o microfone para falar com o Cogni.',
    )
    expect(screen.getByTestId('voice-announcer')).toHaveTextContent('Permita o microfone')
    await user.type(field(), 'Escrevo então')
    expect(field()).toHaveValue('Escrevo então')
  })

  it('says when the transcription did not work and keeps what was typed', async () => {
    const { user } = setup({
      transcribe: () => Promise.resolve({ ok: false, notice: 'failed' }),
    })

    await user.type(field(), 'Antes')
    await user.click(screen.getByRole('button', { name: 'Falar' }))
    await user.click(screen.getByRole('button', { name: 'Parar e revisar' }))

    expect(await screen.findByTestId('voice-notice')).toHaveTextContent(
      'Não deu para transcrever agora. Tente de novo ou escreva.',
    )
    expect(field()).toHaveValue('Antes')
  })

  it('shows a still indicator with the time when the person prefers less motion', async () => {
    preferReducedMotion()
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Falar' }))

    expect(screen.queryByTestId('voice-waveform')).not.toBeInTheDocument()
    expect(screen.getByTestId('voice-recording-static')).toHaveTextContent('Gravando · 0:00')
  })

  it('stops by itself after two minutes and leaves the text to review', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({
      advanceTimers: (ms) => {
        jest.advanceTimersByTime(ms)
      },
    })
    const { media, capture } = fakeMedia()
    renderWithIntl(
      <ChatComposer
        pending={false}
        onSend={() => Promise.resolve(true)}
        notes={[]}
        voice
        media={media}
        transcribe={() => Promise.resolve(spoken)}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Falar' }))
    await act(async () => {
      jest.advanceTimersByTime(120_000)
      await Promise.resolve()
    })
    jest.useRealTimers()

    await waitFor(() => {
      expect(field()).toHaveValue('Dormi mal hoje')
    })
    expect(capture.finish).toHaveBeenCalled()
  })

  it('lowers the background sound while recording and lets it back up after', async () => {
    Object.defineProperty(window.navigator, 'userActivation', {
      configurable: true,
      value: { hasBeenActive: true, isActive: false },
    })
    const engine = fakeEngine()
    const { user } = setup({
      wrap: (children) => (
        <AmbientRoot pathname="/zen/topics/sleep" engine={() => engine}>
          {children}
        </AmbientRoot>
      ),
    })
    await waitFor(() => {
      expect(engine.play).toHaveBeenCalled()
    })

    await user.click(screen.getByRole('button', { name: 'Falar' }))
    expect(engine.setDucked).toHaveBeenLastCalledWith(true)

    await user.click(screen.getByRole('button', { name: 'Cancelar gravação' }))
    expect(engine.setDucked).toHaveBeenLastCalledWith(false)
  })

  it('releases the microphone if the chat closes while recording', async () => {
    const { media, capture } = fakeMedia()
    const { user, unmount } = setup({ media })

    await user.click(screen.getByRole('button', { name: 'Falar' }))
    unmount()

    expect(capture.discard).toHaveBeenCalled()
  })
})
