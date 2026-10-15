import { afterEach, describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { patientReading, testTimeZone } from '../test-data'
import { PatientReadings } from './patient-readings'
import { ReadingTeaser } from './reading-teaser'

const latest = patientReading(14)
const earlier = patientReading(7, {
  content: {
    summary: 'Uma semana de altos e baixos.',
    highlights: ['A caminhada apareceu nos melhores dias.'],
    suggestions: [{ title: 'Repetir a caminhada', detail: 'Duas vezes por semana.' }],
  },
})
const progress = { enabled: true, recorded: 3 }

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('PatientReadings', () => {
  it('shows the latest reading with its period, highlights and suggestions', () => {
    renderWithIntl(
      <PatientReadings readings={[latest]} progress={progress} timeZone={testTimeZone} />,
    )

    const section = screen.getByRole('region', { name: 'Resumo dos seus registros' })
    expect(section).toHaveTextContent('8 – 14 de outubro · 7 registros')
    expect(section).toHaveTextContent(latest.content.summary)
    expect(within(section).getByRole('heading', { name: 'O que se destacou' })).toBeVisible()
    expect(section).toHaveTextContent('Você dormiu bem em quatro das sete noites.')
    expect(section).toHaveTextContent('Proteger o horário de dormir')
    expect(section).toHaveTextContent(
      'Escrito automaticamente a partir dos seus registros. Não é um diagnóstico.',
    )
    expect(document.getElementById(`reading-${latest.id}`)).toHaveTextContent(
      latest.content.summary,
    )
  })

  it('keeps earlier readings folded until asked', async () => {
    const user = userEvent.setup()
    renderWithIntl(
      <PatientReadings readings={[latest, earlier]} progress={progress} timeZone={testTimeZone} />,
    )
    const toggle = screen.getByRole('button', { name: /1\s–\s7 de outubro/ })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Uma semana de altos e baixos.')).not.toBeInTheDocument()

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Uma semana de altos e baixos.')).toBeVisible()
    expect(document.getElementById(`reading-${earlier.id}`)).toContainElement(toggle)
  })

  it('opens the earlier reading a link points to', () => {
    window.history.replaceState(null, '', `/patterns#reading-${earlier.id}`)

    renderWithIntl(
      <PatientReadings readings={[latest, earlier]} progress={progress} timeZone={testTimeZone} />,
    )

    expect(screen.getByRole('button', { name: /1\s–\s7 de outubro/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByText('Uma semana de altos e baixos.')).toBeVisible()
  })

  it('explains when the first reading arrives and how far along the person is', () => {
    renderWithIntl(<PatientReadings readings={[]} progress={progress} timeZone={testTimeZone} />)

    const section = screen.getByRole('region', { name: 'Resumo dos seus registros' })
    expect(section).toHaveTextContent('A cada 7 registros, aparece aqui um resumo curto')
    expect(section).toHaveTextContent('não é um diagnóstico')
    expect(section).toHaveTextContent('3 de 7 registros para o primeiro resumo')
    expect(section.querySelectorAll('[data-filled="true"]')).toHaveLength(3)
  })

  it('points to the setting when readings are turned off', () => {
    renderWithIntl(
      <PatientReadings
        readings={[]}
        progress={{ enabled: false, recorded: 9 }}
        timeZone={testTimeZone}
      />,
    )

    expect(screen.getByText(/Os resumos estão desligados na sua conta\./)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ligar no seu perfil' })).toHaveAttribute('href', '/me')
    expect(screen.queryByText(/para o primeiro resumo/)).not.toBeInTheDocument()
  })

  it('speaks European Portuguese', () => {
    renderWithIntl(
      <PatientReadings readings={[latest]} progress={progress} timeZone={testTimeZone} />,
      { locale: 'pt-PT' },
    )

    expect(screen.getByRole('region', { name: 'Resumo dos seus registos' })).toHaveTextContent(
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
