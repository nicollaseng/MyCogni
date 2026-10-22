import { describe, expect, it, jest } from '@jest/globals'
import type { Locale } from '@mycogni/domain'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import type { JoinValues } from '../join'
import { JoinForm } from './join-form'

function renderForm(locale: Locale = 'pt-BR') {
  const join = jest.fn<(values: JoinValues) => Promise<ActionResult<null>>>(() =>
    Promise.resolve({ ok: true, value: null }),
  )
  const user = userEvent.setup()
  renderWithIntl(<JoinForm join={join} />, { locale })
  return { join, user }
}

describe('JoinForm', () => {
  it('asks a psychologist for the CRP state and number and shows how it will read', async () => {
    const { join, user } = renderForm()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Profissão' }), 'Psicologia')
    await user.type(screen.getByLabelText('Nome completo'), 'Helena Prado')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Enviar para verificação' }))

    expect(screen.getByRole('group', { name: 'Registro no CRP' })).toBeInTheDocument()
    expect(screen.getByText('Escolha o estado do seu conselho.')).toBeInTheDocument()
    expect(screen.getByText('Informe o número do registro.')).toBeInTheDocument()
    expect(join).not.toHaveBeenCalled()

    await user.selectOptions(screen.getByLabelText('Estado (UF)'), 'SP')
    await user.type(screen.getByLabelText('Número'), '12.345-6')

    expect(screen.getByLabelText('Número')).toHaveValue('123456')
    expect(screen.getByText('Seu registro: CRP 06/123456')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Enviar para verificação' }))

    expect(join).toHaveBeenCalledWith({
      kind: 'psychologist',
      fullName: 'Helena Prado',
      uf: 'SP',
      number: '123456',
      institutionRegistration: '',
      accepted: true,
    })
  })

  it('formats a CRM with the state and refuses a short number', async () => {
    const { join, user } = renderForm()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Profissão' }), 'Medicina')
    await user.type(screen.getByLabelText('Nome completo'), 'Rafael Costa')
    await user.selectOptions(screen.getByLabelText('Estado (UF)'), 'RJ')
    await user.type(screen.getByLabelText('Número'), '123')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Enviar para verificação' }))

    expect(screen.getByRole('group', { name: 'Registro no CRM' })).toBeInTheDocument()
    expect(screen.getByText('Use de 4 a 8 números.')).toBeInTheDocument()
    expect(join).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Número'), '4567')

    expect(screen.getByText('Seu registro: CRM-RJ 1234567')).toBeInTheDocument()
  })

  it('lets a psychoanalyst sign up without a council, with an optional institution registration', async () => {
    const { join, user } = renderForm()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Profissão' }), 'Psicanálise')
    await user.type(screen.getByLabelText('Nome completo'), 'Rafael Lima')
    await user.click(screen.getByRole('checkbox'))

    expect(screen.queryByLabelText('Estado (UF)')).not.toBeInTheDocument()
    expect(
      screen.getByLabelText('Registro da formação ou associação (opcional)'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Enviar para verificação' }))

    expect(join).toHaveBeenCalledWith({
      kind: 'psychoanalyst',
      fullName: 'Rafael Lima',
      uf: '',
      number: '',
      institutionRegistration: '',
      accepted: true,
    })
  })

  it('waits for the terms and the privacy policy to be accepted', async () => {
    const { join, user } = renderForm()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Profissão' }), 'Psiquiatria')
    await user.type(screen.getByLabelText('Nome completo'), 'Marta Ribeiro')
    await user.selectOptions(screen.getByLabelText('Estado (UF)'), 'SP')
    await user.type(screen.getByLabelText('Número'), '123456')
    await user.click(screen.getByRole('button', { name: 'Enviar para verificação' }))

    expect(
      screen.getByText('Para continuar, aceite os termos de uso e a política de privacidade.'),
    ).toBeInTheDocument()
    expect(join).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('checkbox', { name: /Tenho 18 anos ou mais e aceito os termos de uso/ }),
    )
    await user.click(screen.getByRole('button', { name: 'Enviar para verificação' }))

    expect(join).toHaveBeenCalledTimes(1)
  })

  it('explains every missing field in the chosen language', async () => {
    const { user } = renderForm('en-US')

    await user.click(screen.getByRole('button', { name: 'Send for verification' }))

    expect(screen.getByText('Choose your profession.')).toBeInTheDocument()
    expect(screen.getByText('Enter your full name.')).toBeInTheDocument()
    expect(
      screen.getByText('To continue, accept the terms of use and the privacy policy.'),
    ).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Profession' }), 'Psychiatry')

    expect(screen.getByText('Choose the state of your council.')).toBeInTheDocument()
    expect(screen.getByText('Enter your registration number.')).toBeInTheDocument()
  })

  it('shows the error the server answers with', async () => {
    const join = jest.fn<(values: JoinValues) => Promise<ActionResult<null>>>(() =>
      Promise.resolve({ ok: false, error: 'Não conseguimos enviar seu cadastro agora.' }),
    )
    const user = userEvent.setup()
    renderWithIntl(<JoinForm join={join} />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Profissão' }), 'Medicina')
    await user.type(screen.getByLabelText('Nome completo'), 'Rafael Costa')
    await user.selectOptions(screen.getByLabelText('Estado (UF)'), 'RJ')
    await user.type(screen.getByLabelText('Número'), '654321')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Enviar para verificação' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não conseguimos enviar seu cadastro agora.',
    )
  })
})
