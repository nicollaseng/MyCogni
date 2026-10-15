import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { patient, testTimeZone } from '../test-data'
import { PatientHeader } from './patient-header'

describe('PatientHeader', () => {
  it('notes that the patient has not confirmed the updated terms yet', () => {
    renderWithIntl(
      <PatientHeader patient={patient({ termsOutdated: true })} timeZone={testTimeZone} />,
    )

    expect(screen.getByText('Aguardando confirmação dos termos atualizados')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Páginas do MyBook compartilhadas' })).toBeVisible()
  })

  it('says nothing about the terms once they are confirmed', () => {
    renderWithIntl(<PatientHeader patient={patient()} timeZone={testTimeZone} />, {
      locale: 'en-GB',
    })

    expect(screen.getByText(/^Sharing entries with you since/)).toBeInTheDocument()
    expect(screen.queryByText(/updated terms/)).not.toBeInTheDocument()
  })
})
