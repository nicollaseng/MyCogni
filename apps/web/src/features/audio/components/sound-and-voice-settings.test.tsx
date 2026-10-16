import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fakeEngine } from '@/test/ambient'
import { renderWithIntl } from '@/test/render'
import { AmbientRoot } from '../ambient-provider'
import { audioPreferencesKey } from '../preferences'
import { SoundAndVoiceSettings } from './sound-and-voice-settings'

function renderSettings(previews = {}, engine = fakeEngine()) {
  renderWithIntl(
    <AmbientRoot pathname="/me" engine={() => engine}>
      <SoundAndVoiceSettings previews={previews} />
    </AmbientRoot>,
  )
  return { engine, section: within(screen.getByRole('region', { name: 'Som e voz' })) }
}

function stored(): Record<string, unknown> {
  return JSON.parse(window.localStorage.getItem(audioPreferencesKey) ?? '{}') as Record<
    string,
    unknown
  >
}

describe('SoundAndVoiceSettings', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    window.localStorage.clear()
  })

  it('starts from a female voice, normal speed and the sea only in the Zen Space', () => {
    const { section } = renderSettings()

    expect(section.getByLabelText('Voz da leitura')).toHaveDisplayValue(
      'Jessica · feminina, acolhedora',
    )
    expect(section.getByRole('radio', { name: 'Normal' })).toBeChecked()
    expect(section.getByRole('radio', { name: 'Só no Zen Space' })).toBeChecked()
    expect(section.getByLabelText('Qual som')).toHaveDisplayValue('Mar')
    expect(section.getByLabelText('Volume')).toHaveValue('12')
    expect(section.getByText('Essas escolhas ficam salvas só neste aparelho.')).toBeVisible()
    expect(section.queryByRole('button', { name: 'Ouvir amostra' })).not.toBeInTheDocument()
  })

  it('saves every choice on this device', async () => {
    const user = userEvent.setup()
    const { section } = renderSettings()

    await user.selectOptions(section.getByLabelText('Voz da leitura'), 'mark')
    await user.click(section.getByRole('radio', { name: 'Mais devagar' }))
    await user.click(section.getByRole('radio', { name: 'Em todo o app' }))
    await user.selectOptions(section.getByLabelText('Qual som'), 'rain')

    expect(stored()).toEqual({
      voice: 'mark',
      speed: 0.9,
      sound: 'rain',
      volume: 0.12,
      scope: 'app',
    })
  })

  it('hides the sound choices when the background sound is off', async () => {
    const user = userEvent.setup()
    const { section } = renderSettings()

    await user.click(section.getByRole('radio', { name: 'Desligado' }))

    expect(section.queryByLabelText('Qual som')).not.toBeInTheDocument()
    expect(section.queryByLabelText('Volume')).not.toBeInTheDocument()
    expect(stored()).toMatchObject({ scope: 'off' })
  })

  it('previews the chosen sound for a few seconds without saving anything else', async () => {
    const user = userEvent.setup()
    const { section, engine } = renderSettings()

    await user.click(section.getByRole('button', { name: 'Ouvir' }))

    expect(engine.unlock).toHaveBeenCalled()
    expect(engine.play).toHaveBeenCalledWith('sea')
    expect(section.getByRole('button', { name: 'Parar' })).toBeVisible()
  })

  it.each([
    ['night-forest', 'Floresta à noite'],
    ['birdsong', 'Pássaros'],
    ['meadow', 'Campo'],
    ['campfire', 'Fogueira'],
    ['mountain-wind', 'Montanha'],
    ['snow', 'Neve'],
    ['owl', 'Coruja'],
  ] as const)('lets the person choose, preview and keep %s', async (sound, name) => {
    const user = userEvent.setup()
    const { section, engine } = renderSettings()

    await user.selectOptions(section.getByLabelText('Qual som'), sound)
    await user.click(section.getByRole('button', { name: 'Ouvir' }))

    expect(section.getByLabelText('Qual som')).toHaveDisplayValue(name)
    expect(engine.play).toHaveBeenCalledWith(sound)
    expect(stored()).toMatchObject({ sound })
  })

  it('plays a voice sample when one exists', async () => {
    const user = userEvent.setup()
    const play = jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    const { section } = renderSettings({ jessica: 'https://storage.test/sample.mp3' })

    await user.click(section.getByRole('button', { name: 'Ouvir amostra' }))

    expect(play).toHaveBeenCalled()
  })

  it('still works when the browser blocks storage', async () => {
    const user = userEvent.setup()
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { section } = renderSettings()

    await user.selectOptions(section.getByLabelText('Qual som'), 'forest')

    expect(section.getByLabelText('Qual som')).toHaveDisplayValue('Floresta')
  })
})
