import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UploadResult } from '@/shared/lib/uploads'
import { renderWithIntl } from '@/test/render'
import { DocumentUpload } from './document-upload'

function file(name: string, type: string, size: number): File {
  const document = new File(['x'], name, { type })
  Object.defineProperty(document, 'size', { value: size })
  return document
}

function renderUpload(result: UploadResult<null> = { ok: true, value: null }) {
  const send = jest.fn<(file: File) => Promise<UploadResult<null>>>().mockResolvedValue(result)
  const onSent = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
  const user = userEvent.setup({ applyAccept: false })
  renderWithIntl(<DocumentUpload proof="crp" onSent={onSent} send={send} />)
  return { send, onSent, user }
}

describe('DocumentUpload', () => {
  it('asks for the right proof and says how the document is used', () => {
    renderUpload()

    expect(screen.getByText('Carteira do CRP')).toBeInTheDocument()
    expect(screen.getByLabelText('Escolher arquivo')).toHaveAccessibleDescription(
      expect.stringContaining('Apenas a equipe MyCogniAI tem acesso'),
    )
    expect(screen.getByRole('button', { name: 'Enviar comprovante' })).toBeDisabled()
  })

  it('sends the chosen document and confirms it arrived', async () => {
    const { send, onSent, user } = renderUpload()
    const card = file('Carteira CRP.pdf', 'application/pdf', 300 * 1024)

    await user.upload(screen.getByLabelText('Escolher arquivo'), card)
    expect(screen.getByText('Carteira CRP.pdf')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Enviar comprovante' }))

    expect(send).toHaveBeenCalledWith(card)
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Comprovante enviado. Vamos conferir em breve.',
    )
    expect(onSent).toHaveBeenCalled()
  })

  it('refuses other formats and files over 10 MB before sending', async () => {
    const { send, user } = renderUpload()
    const input = screen.getByLabelText('Escolher arquivo')

    await user.upload(input, file('carteira.docx', 'application/msword', 1024))
    expect(screen.getByRole('alert')).toHaveTextContent('Use um arquivo PDF, JPG ou PNG.')

    await user.upload(input, file('scan.png', 'image/png', 10 * 1024 * 1024 + 1))
    expect(screen.getByRole('alert')).toHaveTextContent('O arquivo precisa ter até 10 MB.')
    expect(screen.getByRole('button', { name: 'Enviar comprovante' })).toBeDisabled()
    expect(send).not.toHaveBeenCalled()
  })

  it('says when the document could not be sent', async () => {
    const { onSent, user } = renderUpload({ ok: false, problem: 'failed' })

    await user.upload(
      screen.getByLabelText('Escolher arquivo'),
      file('crp.jpg', 'image/jpeg', 2048),
    )
    await user.click(screen.getByRole('button', { name: 'Enviar comprovante' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não conseguimos enviar o comprovante agora. Tente de novo em instantes.',
    )
    expect(onSent).not.toHaveBeenCalled()
  })

  it('asks psychoanalysts for proof from their institution, in English too', () => {
    renderWithIntl(
      <DocumentUpload
        proof="institution"
        onSent={() => Promise.resolve()}
        send={() => Promise.resolve({ ok: true, value: null })}
      />,
      { locale: 'en-US' },
    )

    expect(screen.getByText('Proof of training')).toBeInTheDocument()
    expect(screen.getByLabelText('Choose file')).toBeInTheDocument()
  })
})
