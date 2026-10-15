import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { ScreeningSchedule } from './screening-schedule'

const zone = 'America/Sao_Paulo'
const now = new Date('2026-10-15T15:00:00Z')

describe('ScreeningSchedule', () => {
  it('says from when to answer again while it is not time yet', () => {
    renderWithIntl(
      <ScreeningSchedule
        lastAnswer="2026-10-03T13:00:00Z"
        now={now}
        timeZone={zone}
        offerRetake="whenDue"
      />,
    )

    expect(
      screen.getByText(
        'Sugerimos responder de novo a partir de 17 de outubro, para ver como você muda.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('invites to answer again after two weeks', () => {
    renderWithIntl(
      <ScreeningSchedule
        lastAnswer="2026-09-25T13:00:00Z"
        now={now}
        timeZone={zone}
        offerRetake="whenDue"
      />,
    )

    expect(
      screen.getByText(
        'Já se passaram 20 dias desde as últimas respostas. Você já pode responder de novo.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Refazer os questionários' })).toHaveAttribute(
      'href',
      '/questionnaires',
    )
  })

  it('always offers to answer again from the account page, in English too', () => {
    renderWithIntl(
      <ScreeningSchedule
        lastAnswer="2026-10-03T13:00:00Z"
        now={now}
        timeZone={zone}
        offerRetake="always"
      />,
      { locale: 'en-US' },
    )

    expect(
      screen.getByText('We suggest answering again from October 17, to see how you change.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retake the questionnaires' })).toBeInTheDocument()
  })
})
