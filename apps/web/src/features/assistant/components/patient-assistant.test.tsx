import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { conversationId, fakeActions, overview } from '../test-data'
import { PatientAssistant } from './patient-assistant'

describe('PatientAssistant', () => {
  it('opens the chat about this patient only', async () => {
    const actions = fakeActions({ overview: overview(true), contacts: [] })
    renderWithIntl(
      <PatientAssistant
        patientId={conversationId}
        name="Ana Lima"
        actions={actions}
        timeZone="America/Sao_Paulo"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Perguntar sobre este paciente' }))

    expect(screen.getByRole('dialog', { name: 'Perguntar sobre Ana Lima' })).toBeInTheDocument()
    expect(await screen.findByText('Como o humor mudou nas últimas semanas?')).toBeInTheDocument()
    expect(actions.open).toHaveBeenCalledWith({ mode: 'professional', patientId: conversationId })
  })

  it('speaks English when the professional does', async () => {
    renderWithIntl(
      <PatientAssistant
        patientId={conversationId}
        name="Ana Lima"
        actions={fakeActions({ overview: overview(true), contacts: [] })}
        timeZone="Europe/London"
      />,
      { locale: 'en-GB' },
    )

    await userEvent.click(screen.getByRole('button', { name: 'Ask about this patient' }))

    expect(screen.getByRole('dialog', { name: 'Ask about Ana Lima' })).toBeInTheDocument()
  })
})
