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
  it('asks for the council registration of a psychologist', async () => {
    const { join, user } = renderForm()

    await user.click(screen.getByRole('radio', { name: 'Psicologia' }))
    await user.type(screen.getByLabelText('Nome completo'), 'Helena Prado')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Enviar para verificação' }))

    expect(screen.getByText('Informe seu registro no conselho.')).toBeInTheDocument()
    expect(join).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Registro no conselho'), 'CRP 06/123456')
    await user.click(screen.getByRole('button', { name: 'Enviar para verificação' }))

    expect(join).toHaveBeenCalledWith({
      kind: 'psychologist',
      fullName: 'Helena Prado',
      registration: 'CRP 06/123456',
      accepted: true,
    })
  })

  it('lets a psychoanalyst sign up without a registration', async () => {
    const { join, user } = renderForm()

    await user.click(screen.getByRole('radio', { name: 'Psicanálise' }))
    await user.type(screen.getByLabelText('Nome completo'), 'Rafael Lima')
    await user.click(screen.getByRole('checkbox'))

    expect(screen.getByLabelText('Registro profissional (opcional)')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Enviar para verificação' }))

    expect(join).toHaveBeenCalledWith({
      kind: 'psychoanalyst',
      fullName: 'Rafael Lima',
      registration: '',
      accepted: true,
    })
  })

  it('waits for the terms and the privacy policy to be accepted', async () => {
    const { join, user } = renderForm()

    await user.click(screen.getByRole('radio', { name: 'Psiquiatria' }))
    await user.type(screen.getByLabelText('Nome completo'), 'Marta Ribeiro')
    await user.type(screen.getByLabelText('Registro no conselho'), 'CRM-SP 123456')
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

    await user.click(screen.getByRole('radio', { name: 'Psychiatry' }))

    expect(screen.getByText('Enter your license number.')).toBeInTheDocument()
  })

  it('shows the error the server answers with', async () => {
    const join = jest.fn<(values: JoinValues) => Promise<ActionResult<null>>>(() =>
      Promise.resolve({ ok: false, error: 'Não conseguimos enviar seu cadastro agora.' }),
    )
    const user = userEvent.setup()
    renderWithIntl(<JoinForm join={join} />)

    await user.click(screen.getByRole('radio', { name: 'Medicina' }))
    await user.type(screen.getByLabelText('Nome completo'), 'Rafael Costa')
    await user.type(screen.getByLabelText('Registro no conselho'), 'CRM-RJ 654321')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Enviar para verificação' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não conseguimos enviar seu cadastro agora.',
    )
  })
})
