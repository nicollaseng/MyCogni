import { describe, expect, it, jest } from '@jest/globals'
import { supportAttachmentLimits } from '@mycogni/domain'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import type { SendResult } from '../form'
import { prepareAttachment, type SendTicket } from '../send'
import { TicketForm } from './ticket-form'

const message = 'O app fecha sozinho quando abro os registros pelo celular.'

function fileOf(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

function renderForm(result: SendResult = { ok: true, ticket: sentTicket }) {
  const send = jest.fn<SendTicket>(() => Promise.resolve(result))
  const onSent = jest.fn<() => Promise<void>>(() => Promise.resolve())
  const user = userEvent.setup({ applyAccept: false })
  renderWithIntl(
    <TicketForm role="patient" email="marina@exemplo.com" send={send} onSent={onSent} />,
  )
  return { send, onSent, user }
}

const sentTicket = { id: '0b7c6c8e-6a8f-4f53-9f4b-000000000051', number: 1042, emailSent: true }

describe('TicketForm', () => {
  it('asks for a subject and a message before sending', async () => {
    const { send, user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(screen.getByText('Escolha um assunto.')).toBeInTheDocument()
    expect(screen.getByText('Escreva a mensagem, com pelo menos 10 caracteres.')).toBeVisible()
    expect(screen.getByLabelText('Assunto')).toHaveFocus()
    expect(screen.getByLabelText('Assunto')).toHaveAttribute('aria-invalid', 'true')
    expect(send).not.toHaveBeenCalled()
  })

  it('asks what the subject is when none of the listed ones fits', async () => {
    const { send, user } = renderForm()

    expect(screen.queryByLabelText('Qual é o assunto?')).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Assunto'), 'Outro assunto')
    await user.type(screen.getByLabelText('Mensagem'), message)
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(screen.getByText('Escreva o assunto, com pelo menos 3 caracteres.')).toBeVisible()
    expect(screen.getByLabelText('Qual é o assunto?')).toHaveFocus()
    expect(send).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Qual é o assunto?'), 'Exportar dados')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(send).toHaveBeenCalledWith(
      { subject: 'other', customSubject: 'Exportar dados', message },
      'patient',
      null,
    )
  })

  it('counts what was written against the limit', async () => {
    const { user } = renderForm()

    await user.type(screen.getByLabelText('Mensagem'), 'Olá equipe')

    expect(screen.getByText('10 de 4000')).toBeInTheDocument()
  })

  it('takes photos of up to 5 MB and files of up to 2 MB', async () => {
    const { user } = renderForm()
    const input = screen.getByLabelText('Escolher arquivo')

    await user.upload(
      input,
      fileOf('foto.jpg', 'image/jpeg', supportAttachmentLimits.imageBytes + 1),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A foto passa de 5 MB. Escolha uma menor.',
    )

    await user.upload(
      input,
      fileOf('exame.pdf', 'application/pdf', supportAttachmentLimits.fileBytes + 1),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O arquivo passa de 2 MB. Escolha um menor.',
    )

    await user.upload(input, fileOf('app.exe', 'application/x-msdownload', 100))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Envie uma foto JPG, PNG, WebP ou HEIC, ou um arquivo PDF ou TXT.',
    )

    await user.upload(input, fileOf('tela.png', 'image/png', 4 * 1024 * 1024))
    expect(await screen.findByText('tela.png')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Trocar arquivo')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remover o anexo tela.png' }))
    expect(screen.queryByText('tela.png')).not.toBeInTheDocument()
  })

  it('tells when an iPhone photo could not be converted', async () => {
    expect(await prepareAttachment(fileOf('IMG_0001.heic', 'image/heic', 1000))).toEqual({
      ok: false,
      issue: 'convert',
    })
  })

  it('sends the attachment with the ticket and shows the ticket number', async () => {
    const { send, onSent, user } = renderForm()
    const photo = fileOf('tela.png', 'image/png', 2048)

    await user.selectOptions(screen.getByLabelText('Assunto'), 'Problema técnico')
    await user.type(screen.getByLabelText('Mensagem'), message)
    await user.upload(screen.getByLabelText('Escolher arquivo'), photo)
    await screen.findByText('tela.png')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(send).toHaveBeenCalledWith(
      { subject: 'technical', customSubject: '', message },
      'patient',
      photo,
    )
    const heading = await screen.findByRole('heading', { name: 'Chamado #1042 aberto' })
    expect(heading).toHaveFocus()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Enviamos uma confirmação para marina@exemplo.com. A resposta da equipe chega por email.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver chamado' })).toHaveAttribute(
      'href',
      `/support/${sentTicket.id}`,
    )
    expect(screen.getByRole('link', { name: 'Voltar' })).toHaveAttribute('href', '/me/support')
    expect(onSent).toHaveBeenCalledTimes(1)
  })

  it('says when too many tickets were opened today', async () => {
    const { onSent, user } = renderForm({ ok: false, problem: 'limit' })

    await user.selectOptions(screen.getByLabelText('Assunto'), 'Sugestão')
    await user.type(screen.getByLabelText('Mensagem'), message)
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Você já abriu muitos chamados hoje. Tente de novo amanhã.',
    )
    expect(onSent).not.toHaveBeenCalled()
  })

  it('leads professionals back to their own area', async () => {
    const send = jest.fn<SendTicket>(() => Promise.resolve({ ok: true, ticket: sentTicket }))
    const user = userEvent.setup()
    renderWithIntl(<TicketForm role="professional" email={null} send={send} />)

    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
      'href',
      '/pro/settings#support',
    )
    await user.selectOptions(screen.getByLabelText('Assunto'), 'Profissional e vínculo')
    await user.type(screen.getByLabelText('Mensagem'), message)
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(send).toHaveBeenCalledWith(expect.anything(), 'professional', null)
    expect(await screen.findByRole('link', { name: 'Ver chamado' })).toHaveAttribute(
      'href',
      `/pro/support/${sentTicket.id}`,
    )
    expect(
      screen.getByText(
        'Acompanhe a situação do chamado por aqui. A resposta da equipe chega por email.',
      ),
    ).toBeInTheDocument()
  })
})
