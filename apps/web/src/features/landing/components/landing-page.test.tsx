import { describe, expect, it, jest } from '@jest/globals'
import type { Locale } from '@mycogni/domain'
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { LandingPage } from './landing-page'

function chooseLocale() {
  return jest.fn<(locale: Locale) => Promise<void>>().mockResolvedValue()
}

describe('LandingPage', () => {
  it('opens with the question the app asks every day', () => {
    renderWithIntl(<LandingPage chooseLocale={chooseLocale()} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Como você está agora?' }),
    ).toBeInTheDocument()
  })

  it('lets the visitor try the mood scale right away', () => {
    renderWithIntl(<LandingPage chooseLocale={chooseLocale()} />)

    const slider = screen.getByRole('slider', { name: 'Como você está agora?' })
    fireEvent.change(slider, { target: { value: '6' } })

    expect(slider).toHaveAttribute('aria-valuetext', 'Muito bem')
  })

  it('tells the story in sections the header links to', () => {
    renderWithIntl(<LandingPage chooseLocale={chooseLocale()} />)

    const sections = screen.getByRole('navigation', { name: 'Seções' })

    expect(within(sections).getByRole('link', { name: 'Como funciona' })).toHaveAttribute(
      'href',
      '/#como-funciona',
    )
    expect(
      screen.getByRole('region', { name: 'Um minuto por dia, um retrato a cada duas semanas.' }),
    ).toHaveAttribute('id', 'como-funciona')
    expect(
      screen.getByRole('region', { name: 'A IA escreve. Os números vêm de você.' }),
    ).toHaveAttribute('id', 'ia')
    expect(screen.getByRole('region', { name: 'Seus dados são seus.' })).toHaveAttribute(
      'id',
      'privacidade',
    )
    expect(screen.getByRole('region', { name: 'O que as pessoas perguntam.' })).toHaveAttribute(
      'id',
      'perguntas',
    )
  })

  it('shows what the AI writes and where the numbers come from', () => {
    renderWithIntl(<LandingPage chooseLocale={chooseLocale()} />)

    const ai = screen.getByRole('region', { name: 'A IA escreve. Os números vêm de você.' })

    expect(within(ai).getByText(/Foi uma semana mais leve que a anterior/)).toBeInTheDocument()
    expect(within(ai).getByText('Não diagnostica e não fala de remédio.')).toBeInTheDocument()
  })

  it('previews the PHQ-9 with its validated answer options', () => {
    renderWithIntl(<LandingPage chooseLocale={chooseLocale()} />)

    expect(screen.getByText('PHQ-9 · pergunta 2 de 9')).toBeInTheDocument()
    expect(screen.getByText('Mais da metade dos dias')).toBeInTheDocument()
  })

  it('answers a question when it is opened', async () => {
    const user = userEvent.setup()
    renderWithIntl(<LandingPage chooseLocale={chooseLocale()} />)

    const question = screen.getByRole('button', { name: 'O MyCogniAI substitui terapia?' })
    const answer = document.getElementById(question.getAttribute('aria-controls') ?? '')

    expect(question).toHaveAttribute('aria-expanded', 'false')
    expect(answer).toHaveAttribute('inert')

    await user.click(question)

    expect(question).toHaveAttribute('aria-expanded', 'true')
    expect(answer).not.toHaveAttribute('inert')
  })

  it('leads to creating an account from the hero and the end of the page', () => {
    renderWithIntl(<LandingPage chooseLocale={chooseLocale()} />)

    const links = screen.getAllByRole('link', { name: 'Começar' })

    expect(links).toHaveLength(2)
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/sign-up')
    }
  })

  it('lets returning people sign in from the header', () => {
    renderWithIntl(<LandingPage chooseLocale={chooseLocale()} />)

    const header = screen.getByRole('banner')

    expect(within(header).getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/sign-in')
    expect(within(header).getByRole('link', { name: 'Criar conta' })).toHaveAttribute(
      'href',
      '/sign-up',
    )
  })

  it('lets the visitor switch the language from the header', async () => {
    const choose = chooseLocale()
    renderWithIntl(<LandingPage chooseLocale={choose} />)

    const language = within(screen.getByRole('banner')).getByRole('combobox', { name: 'Idioma' })

    expect(language).toHaveValue('pt-BR')

    await userEvent.selectOptions(language, 'English (US)')

    expect(choose).toHaveBeenCalledWith('en-US')
  })

  it('has a footer with crisis lines and legal pages', () => {
    renderWithIntl(<LandingPage chooseLocale={chooseLocale()} />)

    const footer = screen.getByRole('contentinfo')

    expect(within(footer).getByRole('link', { name: '188' })).toHaveAttribute('href', 'tel:188')
    expect(within(footer).getByText('CVV, 24 horas, gratuito')).toBeInTheDocument()
    expect(within(footer).getByRole('link', { name: '192' })).toHaveAttribute('href', 'tel:192')
    expect(within(footer).getByRole('link', { name: 'Termos de uso' })).toHaveAttribute(
      'href',
      '/terms',
    )
    expect(within(footer).getByRole('link', { name: 'Política de privacidade' })).toHaveAttribute(
      'href',
      '/privacy',
    )
    expect(
      within(footer).getByText(`© ${String(new Date().getFullYear())} MyCogniAI. Feito no Brasil.`),
    ).toBeInTheDocument()
  })

  it('speaks American English with US crisis lines', () => {
    renderWithIntl(<LandingPage chooseLocale={chooseLocale()} />, { locale: 'en-US' })

    expect(
      screen.getByRole('heading', { level: 1, name: 'How are you feeling right now?' }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('navigation', { name: 'Sections' })).getByRole('link', {
        name: 'Artificial intelligence',
      }),
    ).toHaveAttribute('href', '/#ia')
    expect(screen.getAllByRole('link', { name: 'Get started' })).toHaveLength(2)
    expect(screen.getByText('More than half the days')).toBeInTheDocument()
    expect(
      within(screen.getByRole('contentinfo')).getByRole('link', { name: '988' }),
    ).toHaveAttribute('href', 'tel:988')
  })

  it('speaks European Portuguese with Portuguese crisis lines', () => {
    renderWithIntl(<LandingPage chooseLocale={chooseLocale()} />, { locale: 'pt-PT' })

    const header = screen.getByRole('banner')

    expect(screen.getByRole('slider', { name: 'Como se sente agora?' })).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: 'Iniciar sessão' })).toHaveAttribute(
      'href',
      '/sign-in',
    )
    expect(screen.getByRole('region', { name: 'Os seus dados são seus.' })).toBeInTheDocument()
    expect(screen.getByText('Funciona no telemóvel?')).toBeInTheDocument()
    expect(
      within(screen.getByRole('contentinfo')).getByRole('link', { name: '808 24 24 24' }),
    ).toHaveAttribute('href', 'tel:808242424')
  })
})
