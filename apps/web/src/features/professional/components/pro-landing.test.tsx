import { describe, expect, it, jest } from '@jest/globals'
import type { Locale } from '@mycogni/domain'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { ProLanding } from './pro-landing'

function renderLanding(locale: Locale) {
  const chooseLocale = jest.fn<(choice: Locale) => Promise<void>>(() => Promise.resolve())
  renderWithIntl(<ProLanding chooseLocale={chooseLocale} />, { locale })
}

const signUp = '/continue?to=/pro/join&via=sign-up'
const signIn = '/continue?to=/pro/join&via=sign-in'

describe('ProLanding', () => {
  it('presents the professional area with every section in order', () => {
    renderLanding('pt-BR')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Acompanhe seus pacientes entre as sessões.' }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('main'))
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual([
      'O que acontece entre uma sessão e outra, organizado para a consulta.',
      'Resumos que poupam leitura e deixam o julgamento com você.',
      'A pessoa decide o que você vê.',
      'Três passos até o primeiro acompanhamento.',
      'Dúvidas de quem atende.',
      'Comece pelo cadastro profissional.',
    ])
  })

  it('leads to the professional sign up and sign in', () => {
    renderLanding('pt-BR')

    const create = screen.getAllByRole('link', { name: 'Criar conta profissional' })
    expect(create.length).toBeGreaterThanOrEqual(2)
    for (const link of create) {
      expect(link).toHaveAttribute('href', signUp)
    }
    for (const link of screen.getAllByRole('link', { name: 'Já tenho conta' })) {
      expect(link).toHaveAttribute('href', signIn)
    }
  })

  it('shows the attention signals and describes the product previews for screen readers', () => {
    renderLanding('pt-BR')

    const signals = screen
      .getAllByRole('list', { name: 'Motivos de atenção' })
      .find((list) => list.childElementCount === 5)
    expect(signals).toHaveTextContent('Item 9 do PHQ-9 positivo')
    expect(signals).toHaveTextContent('Sem registros há 7+ dias')
    expect(
      screen.getByText(/Exemplo da visão geral da área profissional/, { selector: 'figcaption' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Exemplo da ficha de um paciente/, { selector: 'figcaption' }),
    ).toBeInTheDocument()
  })

  it('answers the questions professionals ask and says the summaries are no diagnosis', () => {
    renderLanding('pt-BR')

    const faq = screen.getByRole('region', { name: 'Dúvidas de quem atende.' })
    expect(within(faq).getByText('Quem pode se cadastrar?')).toBeInTheDocument()
    expect(within(faq).getByText('O MyCogniAI avisa sobre crises?')).toBeInTheDocument()
    expect(screen.getByText('Não faz diagnóstico nem sugere tratamento.')).toBeInTheDocument()
  })

  it('speaks English to professionals abroad', () => {
    renderLanding('en-US')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Follow your patients between sessions.' }),
    ).toBeInTheDocument()
    for (const link of screen.getAllByRole('link', { name: 'Create a professional account' })) {
      expect(link).toHaveAttribute('href', signUp)
    }
    expect(screen.getByRole('region', { name: 'Questions from clinicians.' })).toBeInTheDocument()
  })
})
