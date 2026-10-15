import { describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import type { DownloadReport } from '../download'
import { ReportExport } from './report-export'

function succeed(): Promise<boolean> {
  return Promise.resolve(true)
}

async function openSheet(name = 'Exportar relatório') {
  await userEvent.click(screen.getByRole('button', { name }))
  return within(screen.getByRole('dialog', { name }))
}

describe('ReportExport', () => {
  it('starts with a month, without notes and with the summary', async () => {
    renderWithIntl(
      <ReportExport href="/patterns/report" audience="patient" summaries download={succeed} />,
    )

    const sheet = await openSheet()

    expect(sheet.getByRole('radio', { name: 'Últimos 30 dias' })).toBeChecked()
    expect(sheet.getByRole('radio', { name: 'Últimos 7 dias' })).not.toBeChecked()
    expect(sheet.getByRole('switch', { name: 'Suas notas' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(sheet.getByRole('switch', { name: 'Resumo do período' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(
      sheet.getByText('O PDF terá os últimos 30 dias, sem suas notas e com o resumo, se houver.'),
    ).toBeInTheDocument()
  })

  it('downloads the chosen period with the notes when asked and closes', async () => {
    const download = jest.fn<DownloadReport>(succeed)
    renderWithIntl(
      <ReportExport href="/patterns/report" audience="patient" summaries download={download} />,
    )

    const sheet = await openSheet()
    await userEvent.click(sheet.getByRole('radio', { name: 'Últimos 7 dias' }))
    await userEvent.click(sheet.getByRole('switch', { name: 'Suas notas' }))
    await userEvent.click(sheet.getByRole('switch', { name: 'Resumo do período' }))

    expect(sheet.getByText('O PDF terá os últimos 7 dias, com suas notas.')).toBeInTheDocument()
    await userEvent.click(sheet.getByRole('button', { name: 'Baixar PDF' }))

    expect(download).toHaveBeenCalledWith('/patterns/report', {
      days: 7,
      notes: true,
      reading: false,
    })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('leaves the summary out when there is none to include', async () => {
    const download = jest.fn<DownloadReport>(succeed)
    renderWithIntl(
      <ReportExport
        href="/patterns/report"
        audience="patient"
        summaries={false}
        download={download}
      />,
    )

    const sheet = await openSheet()

    expect(sheet.queryByRole('switch', { name: 'Resumo do período' })).not.toBeInTheDocument()
    expect(sheet.getByText('O PDF terá os últimos 30 dias, sem suas notas.')).toBeInTheDocument()
    await userEvent.click(sheet.getByRole('button', { name: 'Baixar PDF' }))
    expect(download).toHaveBeenCalledWith('/patterns/report', {
      days: 30,
      notes: false,
      reading: false,
    })
  })

  it('waits while the file is made and says when it fails', async () => {
    let finish: (done: boolean) => void = () => undefined
    const download = jest.fn<DownloadReport>(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    renderWithIntl(
      <ReportExport href="/patterns/report" audience="patient" summaries download={download} />,
    )

    const sheet = await openSheet()
    await userEvent.click(sheet.getByRole('button', { name: 'Baixar PDF' }))

    expect(sheet.getByRole('button', { name: 'Gerando o PDF…' })).toBeDisabled()
    expect(sheet.getByRole('switch', { name: 'Suas notas' })).toBeDisabled()
    finish(false)

    expect(
      await sheet.findByText(
        'Não conseguimos gerar o relatório agora. Tente de novo em instantes.',
      ),
    ).toBeInTheDocument()
    expect(sheet.getByRole('button', { name: 'Baixar PDF' })).toBeEnabled()
    expect(screen.getByRole('dialog', { name: 'Exportar relatório' })).toBeInTheDocument()
  })

  it('treats a network failure as a failed download', async () => {
    renderWithIntl(
      <ReportExport
        href="/patterns/report"
        audience="patient"
        summaries
        download={() => Promise.reject(new Error('offline'))}
      />,
    )

    const sheet = await openSheet()
    await userEvent.click(sheet.getByRole('button', { name: 'Baixar PDF' }))

    expect(await sheet.findByRole('alert')).toHaveTextContent(
      'Não conseguimos gerar o relatório agora.',
    )
  })

  it('speaks to the professional about the patient in English', async () => {
    const download = jest.fn<DownloadReport>(succeed)
    renderWithIntl(
      <ReportExport
        href="/pro/patients/3e2d1c0b-0000-4000-8000-000000000001/report"
        audience="professional"
        name="Marina Costa"
        summaries
        download={download}
      />,
      { locale: 'en-US' },
    )

    const sheet = await openSheet('Download report')

    expect(
      sheet.getByText(/questionnaires of Marina Costa, using only the check-ins/),
    ).toBeVisible()
    await userEvent.click(sheet.getByRole('switch', { name: 'Their notes' }))
    await userEvent.click(sheet.getByRole('button', { name: 'Download PDF' }))
    expect(download).toHaveBeenCalledWith(
      '/pro/patients/3e2d1c0b-0000-4000-8000-000000000001/report',
      { days: 30, notes: true, reading: true },
    )
  })

  it('closes from cancel without downloading', async () => {
    const download = jest.fn<DownloadReport>(succeed)
    renderWithIntl(
      <ReportExport href="/patterns/report" audience="patient" summaries download={download} />,
    )

    const sheet = await openSheet()
    await userEvent.click(sheet.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(download).not.toHaveBeenCalled()
  })
})
