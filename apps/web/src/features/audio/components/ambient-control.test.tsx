import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fakeEngine } from '@/test/ambient'
import { renderWithIntl } from '@/test/render'
import { AmbientRoot } from '../ambient-provider'
import { saveAudioPreferences } from '../preferences'
import { NarrationPlayer } from './narration-player'
import { AmbientControl } from './ambient-control'

function renderAt(pathname: string, engine = fakeEngine()) {
  const view = renderWithIntl(
    <AmbientRoot pathname={pathname} engine={() => engine}>
      <AmbientControl />
      <NarrationPlayer
        sources={[{ voice: 'jessica', url: 'https://storage.test/a.mp3' }]}
        title="Sono e humor"
      />
    </AmbientRoot>,
  )
  return { engine, ...view }
}

describe('AmbientControl', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    window.localStorage.clear()
  })

  it('shows the sea in the Zen Space and never plays before the person asks', () => {
    const { engine } = renderAt('/zen')

    expect(screen.getByRole('button', { name: 'Som de fundo: Mar' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(engine.unlock).not.toHaveBeenCalled()
    expect(engine.play).not.toHaveBeenCalled()
  })

  it('starts very low after a tap and fades out when tapped again', async () => {
    const user = userEvent.setup()
    const { engine } = renderAt('/zen/tracks/sleep-and-rest')
    const control = screen.getByRole('button', { name: 'Som de fundo: Mar' })

    await user.click(control)

    expect(engine.unlock).toHaveBeenCalled()
    expect(engine.setVolume).toHaveBeenCalledWith(0.12)
    expect(engine.play).toHaveBeenCalledWith('sea')
    expect(control).toHaveAttribute('aria-pressed', 'true')

    engine.stop.mockClear()
    await user.click(control)

    expect(engine.stop).toHaveBeenCalled()
    expect(control).toHaveAttribute('aria-pressed', 'false')
  })

  it('stays out of other pages unless the person chose the whole app', () => {
    renderAt('/today')
    expect(screen.queryByRole('button', { name: /Som de fundo/ })).not.toBeInTheDocument()

    act(() => {
      saveAudioPreferences({ scope: 'app', sound: 'rain' })
    })

    expect(screen.getByRole('button', { name: 'Som de fundo: Chuva' })).toBeVisible()
  })

  it('names the chosen sound in the control', () => {
    saveAudioPreferences({ sound: 'owl' })
    renderAt('/zen')

    expect(screen.getByRole('button', { name: 'Som de fundo: Coruja' })).toHaveTextContent('Coruja')
  })

  it('respects a background sound turned off or set to none', () => {
    saveAudioPreferences({ scope: 'off' })
    const { unmount } = renderAt('/zen')
    expect(screen.queryByRole('button', { name: /Som de fundo/ })).not.toBeInTheDocument()
    unmount()

    saveAudioPreferences({ scope: 'zen', sound: 'none' })
    renderAt('/zen')
    expect(screen.queryByRole('button', { name: /Som de fundo/ })).not.toBeInTheDocument()
  })

  it('lowers the background while the narration plays and brings it back after', async () => {
    const user = userEvent.setup()
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    const { engine, container } = renderAt('/zen/articles/sleep-and-mood')
    await user.click(screen.getByRole('button', { name: 'Som de fundo: Mar' }))
    const audio = container.querySelector('audio')
    if (audio === null) {
      throw new Error('The player has no audio element')
    }

    await user.click(screen.getByRole('button', { name: 'Ouvir: Sono e humor' }))
    fireEvent.play(audio)

    expect(engine.setDucked).toHaveBeenLastCalledWith(true)

    fireEvent.pause(audio)

    expect(engine.setDucked).toHaveBeenLastCalledWith(false)
  })

  it('stops when the tab is hidden and comes back when it is visible again', async () => {
    const user = userEvent.setup()
    const { engine } = renderAt('/zen')
    await user.click(screen.getByRole('button', { name: 'Som de fundo: Mar' }))
    const visibility = jest.spyOn(document, 'visibilityState', 'get')
    engine.stop.mockClear()

    visibility.mockReturnValue('hidden')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(engine.stop).toHaveBeenCalled()

    engine.play.mockClear()
    visibility.mockReturnValue('visible')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(engine.play).toHaveBeenCalledWith('sea')
  })
})
