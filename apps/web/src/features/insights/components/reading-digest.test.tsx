import { afterEach, describe, expect, it } from '@jest/globals'
import type { PatientInsight } from '@mycogni/contracts'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { patientReading, testTimeZone } from '../test-data'
import { ReadingDigest } from './reading-digest'
import { ReadingTeaser } from './reading-teaser'

const latest = patientReading(14)
const earlier = patientReading(7, {
  content: {
    summary: 'Uma semana de altos e baixos.',
    highlights: ['A caminhada apareceu nos melhores dias.'],
    suggestions: [{ title: 'Repetir a caminhada', detail: 'Duas vezes por semana.' }],
  },
})

function renderDigest(
  readings: readonly PatientInsight[] = [latest, earlier],
  locale: 'pt-BR' | 'pt-PT' = 'pt-BR',
) {
  const [first, ...rest] = readings
  if (first === undefined) {
    throw new Error('A reading is needed')
  }
  return renderWithIntl(
    <ReadingDigest
      latest={{ reading: first, period: '8 – 14 de outubro' }}
      teaser="Sua semana terminou mais leve."
      earlier={rest.map((reading) => ({ reading, period: '1 – 7 de outubro' }))}
    />,
    { locale },
  )
}

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('ReadingDigest', () => {
  it('shows only the period and the first sentence until asked', async () => {
    const user = userEvent.setup()
    renderDigest()

    const section = screen.getByRole('region', { name: 'Resumo automático' })
    expect(section).toHaveTextContent('8 – 14 de outubro · 7 registros')
    expect(within(section).getByText('Sua semana terminou mais leve.')).toBeVisible()
    const toggle = within(section).getByRole('button', { name: 'Ler resumo' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(section).not.toHaveTextContent(/não é um diagnóstico/i)

    await user.click(toggle)

    expect(within(section).getByRole('button', { name: 'Fechar resumo' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(within(section).getByRole('heading', { name: 'O que se destacou' })).toBeVisible()
    expect(section).toHaveTextContent('Proteger o horário de dormir')
    expect(within(section).getByRole('button', { name: /1\s–\s7 de outubro/ })).toBeVisible()
  })

  it('keeps every reading reachable by its anchor', () => {
    renderDigest()

    expect(document.getElementById(`reading-${latest.id}`)).toHaveTextContent(
      'Sua semana terminou mais leve.',
    )
    expect(document.getElementById(`reading-${earlier.id}`)).toBeInTheDocument()
  })

  it('opens the reading a notification points to', () => {
    window.history.replaceState(null, '', `/patterns#reading-${earlier.id}`)

    renderDigest()

    expect(screen.getByRole('button', { name: 'Fechar resumo' })).toBeVisible()
    expect(screen.getByRole('button', { name: /1\s–\s7 de outubro/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByText('Uma semana de altos e baixos.')).toBeVisible()
  })

  it('opens again when another reading is linked after the person closed it', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', `/patterns#reading-${latest.id}`)
    renderDigest()

    await user.click(screen.getByRole('button', { name: 'Fechar resumo' }))
    expect(screen.getByRole('button', { name: 'Ler resumo' })).toBeVisible()

    act(() => {
      window.location.hash = `reading-${earlier.id}`
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })

    expect(screen.getByRole('button', { name: 'Fechar resumo' })).toBeVisible()
    expect(screen.getByText('Uma semana de altos e baixos.')).toBeVisible()
  })

  it('speaks European Portuguese', () => {
    renderDigest([latest], 'pt-PT')

    expect(screen.getByRole('region', { name: 'Resumo automático' })).toHaveTextContent(
      '7 registos',
    )
  })
})

describe('ReadingTeaser', () => {
  it('shows the first sentence and links to the full reading on Padrões', () => {
    renderWithIntl(<ReadingTeaser reading={latest} timeZone={testTimeZone} />, {
      locale: 'en-US',
    })

    const section = screen.getByRole('region', { name: 'Your latest summary' })
    expect(section).toHaveTextContent('Sua semana terminou mais leve.')
    expect(section).not.toHaveTextContent('O humor médio subiu')
    expect(section).toHaveTextContent('October 8 – 14')
    expect(within(section).getByRole('link', { name: 'Read the full summary' })).toHaveAttribute(
      'href',
      `/patterns#reading-${latest.id}`,
    )
  })
})
