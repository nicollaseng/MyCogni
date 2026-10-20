import { describe, expect, it } from '@jest/globals'
import { articleIds, todayPick, trackIds, zenSuggestion } from '@mycogni/domain'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AmbientRoot } from '@/features/audio/ambient-provider'
import { fakeEngine } from '@/test/ambient'
import { renderWithIntl } from '@/test/render'
import { fakeRouter, WithRouter } from '@/test/router'
import { ReadingRows, TrackRows } from './library'
import { TodayCard } from './today-card'
import { TopicTiles } from './topic-tiles'
import { ZenHero } from './zen-hero'
import { BreatheRing } from './breathe-ring'

function renderToday(locale: 'pt-BR' | 'pt-PT' = 'pt-BR', anxious = true) {
  const suggestion = zenSuggestion({
    latest: anxious ? [{ instrument: 'gad7', severity: 'moderate', hasRiskFlag: false }] : [],
    moodAverage: null,
  })
  renderWithIntl(
    <WithRouter router={fakeRouter()}>
      <TodayCard
        pick={todayPick(suggestion.tracks, [
          { trackId: 'everyday-anxiety', stepId: 'read-anxiety-basics' },
        ])}
        language={locale}
        reasons={suggestion.reasons}
      />
    </WithRouter>,
    { locale },
  )
}

describe('TodayCard', () => {
  it('recommends one thing for today with its duration and a single primary action', () => {
    renderToday()

    const today = screen.getByRole('region', { name: 'Para hoje' })
    expect(within(today).getByRole('heading', { name: 'Respirar em quadrado' })).toBeVisible()
    expect(within(today).getByText('Ansiedade no dia a dia · passo 2 de 6')).toBeVisible()
    expect(within(today).getByText('Respiração · 1 min')).toBeVisible()
    expect(within(today).getByRole('button', { name: 'Continuar' })).toBeVisible()
    expect(within(today).getByRole('button', { name: 'Respirar 1 min' })).toBeVisible()
  })

  it('keeps the reasons tucked away with a way to answer the questionnaires again', async () => {
    const user = userEvent.setup()
    renderToday()

    await user.click(screen.getByRole('button', { name: 'Por que esta sugestão?' }))

    expect(
      screen.getByText('Sua última resposta sobre ansiedade ficou em moderado ou acima.'),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Refazer os questionários' })).toHaveAttribute(
      'href',
      '/questionnaires',
    )
  })

  it('names a read by its article and links straight to it, in European Portuguese', () => {
    renderToday('pt-PT', false)

    expect(screen.getByRole('region', { name: 'Para hoje' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Sono e humor' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Começar' })).toHaveAttribute(
      'href',
      '/zen/articles/sleep-and-mood',
    )
  })

  it('suggests a minute of breathing when every track is done', () => {
    renderWithIntl(
      <WithRouter router={fakeRouter()}>
        <TodayCard pick={null} language="pt-BR" reasons={['starting']} />
      </WithRouter>,
    )

    expect(screen.getByText(/Você concluiu todas as trilhas/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Respirar 1 min' })).toBeVisible()
  })
})

describe('TopicTiles', () => {
  it('offers five needs as compact tiles', () => {
    renderWithIntl(<TopicTiles />)

    const tiles = within(screen.getByRole('region', { name: 'Do que você precisa?' })).getAllByRole(
      'link',
    )
    expect(tiles.map((tile) => tile.textContent)).toEqual([
      'Ansiedade',
      'Humor',
      'Sono',
      'Pressão e desempenho',
      'Buscar ajuda',
    ])
    expect(tiles[4]).toHaveAttribute('href', '/zen/topics/help')
    for (const tile of tiles) {
      expect(tile.querySelector('svg[aria-hidden]')).not.toBeNull()
      expect(tile.className).toMatch(/min-h-28/)
    }
  })
})

describe('library', () => {
  it('lists tracks by title with their duration or progress', () => {
    renderWithIntl(
      <TrackRows
        ids={trackIds}
        doneSteps={[
          { trackId: 'low-mood', stepId: 'read-behavioural-activation' },
          { trackId: 'low-mood', stepId: 'check-in' },
        ]}
        language="pt-BR"
        title="Trilhas"
      />,
    )

    const rows = within(screen.getByRole('region', { name: 'Trilhas' })).getAllByRole('link')
    expect(rows).toHaveLength(5)
    expect(screen.getByRole('link', { name: /Humor para baixo/ })).toHaveTextContent('2 de 5')
    expect(
      screen.getByRole('link', { name: /Humor para baixo/ }).querySelector('circle + circle'),
    ).not.toBeNull()
    expect(
      screen.getByRole('link', { name: /Sono e descanso/ }).querySelector('circle + circle'),
    ).toBeNull()
    expect(screen.getByRole('link', { name: /Sono e descanso/ })).toHaveTextContent(/\d+ min/)
  })

  it('shows a few reads and folds the rest', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ReadingRows ids={articleIds} language="en" title="Reads" shown={4} />, {
      locale: 'en-GB',
    })
    const reads = within(screen.getByRole('region', { name: 'Reads' }))

    expect(reads.getAllByRole('link')).toHaveLength(4)
    await user.click(reads.getByRole('button', { name: '4 more reads' }))

    expect(reads.getAllByRole('link')).toHaveLength(8)
    expect(reads.getByRole('link', { name: /Worry time/ })).toHaveTextContent(/\d min/)
  })
})

describe('ZenHero', () => {
  it('shows the background sound playing and lets the person pause it from the hero', async () => {
    const user = userEvent.setup()
    Object.defineProperty(window.navigator, 'userActivation', {
      configurable: true,
      value: { hasBeenActive: true, isActive: false },
    })
    const engine = fakeEngine()
    renderWithIntl(
      <AmbientRoot pathname="/zen" engine={() => engine}>
        <ZenHero title="Zen Space" />
      </AmbientRoot>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Zen Space' })).toBeVisible()
    const sound = await screen.findByRole('button', { name: 'Pausar o som de fundo: Mar' })
    expect(sound).toHaveTextContent('Mar · tocando')

    await user.click(sound)

    expect(screen.getByRole('button', { name: 'Tocar o som de fundo: Mar' })).toHaveTextContent(
      'Mar · pausado',
    )
    Reflect.deleteProperty(window.navigator, 'userActivation')
    window.localStorage.clear()
  })

  it('leaves the sound out of the hero when it is off', () => {
    window.localStorage.setItem('mycogni.audio', JSON.stringify({ scope: 'off' }))
    renderWithIntl(
      <AmbientRoot pathname="/zen" engine={() => fakeEngine()}>
        <ZenHero title="Zen Space" />
      </AmbientRoot>,
    )

    expect(screen.queryByRole('button', { name: /som de fundo/ })).not.toBeInTheDocument()
    window.localStorage.clear()
  })
})

describe('BreatheRing', () => {
  it('opens the breathing exercise from the breathing visual', async () => {
    const user = userEvent.setup()
    renderWithIntl(<BreatheRing />)

    await user.click(screen.getByRole('button', { name: 'Respirar 1 min' }))

    expect(screen.getByRole('dialog', { name: 'Respirar em quadrado' })).toBeVisible()
  })
})
