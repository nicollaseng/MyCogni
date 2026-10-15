import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen } from '@testing-library/react'
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

const card = () => file('Carteira CRP.pdf', 'application/pdf', 300 * 1024)

describe('DocumentUpload', () => {
  it('asks for the right proof, says how it is used and offers no action before a file', () => {
    renderUpload()

    expect(screen.getByRole('heading', { name: 'Carteira do CRP' })).toBeInTheDocument()
    expect(screen.getByLabelText('Escolher arquivo')).toHaveAccessibleDescription(
      expect.stringContaining('Apenas a equipe MyCogniAI tem acesso'),
    )
    expect(screen.getByLabelText('Escolher arquivo')).toHaveAccessibleDescription(
      expect.stringContaining('PDF, JPG ou PNG, até 10 MB.'),
    )
    expect(screen.queryByRole('button', { name: 'Enviar comprovante' })).not.toBeInTheDocument()
  })

  it('shows the chosen file and moves to the send action', async () => {
    const { send, onSent, user } = renderUpload()
    const chosen = card()

    await user.upload(screen.getByLabelText('Escolher arquivo'), chosen)

    expect(screen.getByText('Carteira CRP.pdf')).toBeInTheDocument()
    expect(screen.getByText('PDF · 300 kB')).toBeInTheDocument()
    expect(screen.queryByLabelText('Escolher arquivo')).not.toBeInTheDocument()
    const action = screen.getByRole('button', { name: 'Enviar comprovante' })
    expect(action).toHaveFocus()

    await user.click(action)

    expect(send).toHaveBeenCalledWith(chosen)
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Comprovante enviado. Vamos conferir em breve.',
    )
    expect(onSent).toHaveBeenCalled()
  })

  it('replaces and removes the chosen file', async () => {
    const { send, user } = renderUpload()

    await user.upload(screen.getByLabelText('Escolher arquivo'), card())
    await user.upload(screen.getByLabelText('Trocar'), file('crp-frente.jpg', 'image/jpeg', 2048))

    expect(screen.queryByText('Carteira CRP.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('crp-frente.jpg')).toBeInTheDocument()
    expect(screen.getByText('JPG · 2 kB')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remover' }))

    expect(screen.queryByText('crp-frente.jpg')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Escolher arquivo')).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Enviar comprovante' })).not.toBeInTheDocument()
    expect(send).not.toHaveBeenCalled()
  })

  it('refuses other formats and files over 10 MB, keeping a file already chosen', async () => {
    const { send, user } = renderUpload()

    await user.upload(
      screen.getByLabelText('Escolher arquivo'),
      file('carteira.docx', 'application/msword', 1024),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Use um arquivo PDF, JPG ou PNG.')
    expect(screen.queryByRole('button', { name: 'Enviar comprovante' })).not.toBeInTheDocument()

    await user.upload(screen.getByLabelText('Escolher arquivo'), card())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await user.upload(
      screen.getByLabelText('Trocar'),
      file('scan.png', 'image/png', 10 * 1024 * 1024 + 1),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('O arquivo precisa ter até 10 MB.')
    expect(screen.getByText('Carteira CRP.pdf')).toBeInTheDocument()
    expect(send).not.toHaveBeenCalled()
  })

  it('takes a file dropped on the picker', () => {
    renderUpload()
    const dropped = card()
    const picker = screen.getByLabelText('Escolher arquivo').closest('label')

    fireEvent.dragOver(picker ?? document.body)
    fireEvent.drop(picker ?? document.body, { dataTransfer: { files: [dropped] } })

    expect(screen.getByText('Carteira CRP.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar comprovante' })).toBeInTheDocument()
  })

  it('says when the document could not be sent and keeps it for another try', async () => {
    const { onSent, user } = renderUpload({ ok: false, problem: 'failed' })

    await user.upload(
      screen.getByLabelText('Escolher arquivo'),
      file('crp.jpg', 'image/jpeg', 2048),
    )
    await user.click(screen.getByRole('button', { name: 'Enviar comprovante' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não conseguimos enviar o comprovante agora. Tente de novo em instantes.',
    )
    expect(screen.getByText('crp.jpg')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar comprovante' })).toBeEnabled()
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
