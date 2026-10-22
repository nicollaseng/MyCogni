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
import { BreatheRing } from './breathe-ring'

function renderToday(locale: 'pt-BR' | 'pt-PT' = 'pt-BR', anxious = true) {
  const suggestion = zenSuggestion({
    latest: anxious ? [{ instrument: 'gad7', severity: 'moderate', hasRiskFlag: false }] : [],
    moodAverage: null,
  })
  renderWithIntl(
    <WithRouter router={fakeRouter()}>
      <TodayCard
        title="Zen Space"
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
        <TodayCard title="Zen Space" pick={null} language="pt-BR" reasons={['starting']} />
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

describe('the green card at the top', () => {
  function renderTop() {
    const suggestion = zenSuggestion({ latest: [], moodAverage: null })
    const engine = fakeEngine()
    renderWithIntl(
      <AmbientRoot pathname="/zen" engine={() => engine}>
        <WithRouter router={fakeRouter()}>
          <TodayCard
            title="Zen Space"
            pick={todayPick(suggestion.tracks, [])}
            language="pt-BR"
            reasons={suggestion.reasons}
          />
        </WithRouter>
      </AmbientRoot>,
    )
  }

  it('holds the page title, the sound playing and the step for today', async () => {
    const user = userEvent.setup()
    Object.defineProperty(window.navigator, 'userActivation', {
      configurable: true,
      value: { hasBeenActive: true, isActive: false },
    })
    renderTop()

    const title = screen.getByRole('heading', { level: 1, name: 'Zen Space' })
    const card = title.closest('.bg-zen')
    expect(card).not.toBeNull()
    const inCard = within(card as HTMLElement)
    expect(inCard.getByRole('heading', { level: 2, name: 'Para hoje' })).toBeVisible()
    expect(inCard.getByText('Sono e descanso · passo 1 de 5')).toBeVisible()
    expect(inCard.getByRole('heading', { level: 3, name: 'Sono e humor' })).toBeVisible()
    expect(inCard.getByRole('link', { name: 'Começar' })).toHaveAttribute(
      'href',
      '/zen/articles/sleep-and-mood',
    )
    expect(card?.querySelector('svg[aria-hidden]')?.getAttribute('class')).toMatch(
      /animate-zen-swell/,
    )

    const sound = await inCard.findByRole('button', { name: 'Pausar o som de fundo: Mar' })
    expect(sound).toHaveTextContent('Mar · tocando')
    expect(sound.querySelector('svg[data-sound]')).toHaveAttribute('data-sound', 'sea')
    await user.click(sound)
    expect(inCard.getByRole('button', { name: 'Tocar o som de fundo: Mar' })).toHaveTextContent(
      'Mar · pausado',
    )
    Reflect.deleteProperty(window.navigator, 'userActivation')
    window.localStorage.clear()
  })

  it('leaves the sound out of the card when it is off', () => {
    window.localStorage.setItem('mycogni.audio', JSON.stringify({ scope: 'off' }))
    renderTop()

    expect(screen.getByRole('heading', { level: 1, name: 'Zen Space' })).toBeVisible()
    expect(screen.queryByRole('button', { name: /som de fundo/ })).not.toBeInTheDocument()
    window.localStorage.clear()
  })
})

describe('BreatheRing', () => {
  it('opens the breathing exercise from the breathing visual', async () => {
    const user = userEvent.setup()
    renderWithIntl(<BreatheRing />)

    await user.click(screen.getByRole('button', { name: 'Respirar 1 min' }))

    const mode = screen.getByRole('dialog', { name: 'Respirar em quadrado' })
    expect(mode).toBeVisible()
    expect(mode.className).toMatch(/fixed inset-0/)
    expect(within(mode).getByTestId('breathing-relief')).toBeVisible()
  })
})

describe('personal reasons', () => {
  function renderSuggestion(night: boolean) {
    const suggestion = zenSuggestion({
      latest: [],
      moodAverage: null,
      records: Array.from({ length: 3 }, () => ({
        moodLevel: 3,
        emotions: [],
        contexts: ['sleep'],
      })),
      night,
    })
    renderWithIntl(
      <WithRouter router={fakeRouter()}>
        <TodayCard
          title="Zen Space"
          pick={todayPick(suggestion.tracks, [])}
          language="pt-BR"
          reasons={suggestion.reasons}
          night={suggestion.reasons.includes('night')}
        />
      </WithRouter>,
    )
  }

  it('explains a suggestion that comes from the records in one plain sentence', async () => {
    const user = userEvent.setup()
    renderSuggestion(false)

    expect(screen.getByRole('heading', { name: 'Sono e humor' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Por que esta sugestão?' }))

    expect(screen.getByText('O sono apareceu em vários registros recentes.')).toBeVisible()
    expect(screen.queryByText('É noite: um passo para descansar.')).not.toBeInTheDocument()
  })

  it('puts the breathing minute first at night and says it is night', async () => {
    const user = userEvent.setup()
    renderSuggestion(true)

    const breathe = screen.getByRole('button', { name: 'Respirar 1 min' })
    const title = screen.getByRole('heading', { level: 1, name: 'Zen Space' })
    const heading = screen.getByRole('heading', { name: 'Para hoje' })
    expect(breathe.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(breathe.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(title.closest('.bg-zen')?.contains(breathe)).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Por que esta sugestão?' }))

    expect(screen.getByText('É noite: um passo para descansar.')).toBeVisible()
    expect(screen.getByText('O sono apareceu em vários registros recentes.')).toBeVisible()
  })

  it('keeps the breathing minute after today at daytime', () => {
    renderSuggestion(false)

    const breathe = screen.getByRole('button', { name: 'Respirar 1 min' })
    const title = screen.getByRole('heading', { level: 1, name: 'Zen Space' })
    expect(breathe.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
  })
})
