import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { professionalReading, testTimeZone } from '@/features/insights/test-data'
import { renderWithIntl } from '@/test/render'
import { ReadingsSection } from './readings-section'

const latest = professionalReading(14, {
  attention: 'watch',
  attentionReason: 'Preocupação com trabalho em três registros seguidos.',
})
const calm = professionalReading(7, { summary: 'Humor estável, sem conteúdo de risco.' })
const urgent = professionalReading(21, {
  attention: 'urgent',
  attentionReason: 'Nota menciona vontade de se machucar.',
  trends: [],
})

describe('ReadingsSection', () => {
  it('shows the latest reading with the attention level as a dot and a word', () => {
    renderWithIntl(<ReadingsSection readings={[latest, calm]} timeZone={testTimeZone} />)

    const section = screen.getByRole('region', { name: 'Resumos' })
    expect(section).toHaveTextContent(
      'Escritos automaticamente a partir dos registros compartilhados com você, sem o MyBook. Não fazem diagnóstico.',
    )
    expect(section).toHaveTextContent('8 – 14 de out. de 2026 · 7 registros')
    const level = section.querySelector('[data-attention="watch"]')
    expect(level).toHaveTextContent('Observar')
    expect(level?.querySelector('[aria-hidden]')).toHaveClass('rounded-full')
    expect(section).toHaveTextContent('Preocupação com trabalho em três registros seguidos.')
    expect(section).toHaveTextContent('Melhora consistente do humor no período.')
    expect(within(section).getByRole('heading', { name: 'Tendências' })).toBeVisible()
    expect(section).toHaveTextContent('Média de humor 4,1, alta de 0,8.')
    expect(within(section).getByRole('heading', { name: 'Temas' })).toBeVisible()
    expect(section).toHaveTextContent('SonoTrabalho')
  })

  it('lists earlier readings in a table and expands a row to read it', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ReadingsSection readings={[latest, calm, urgent]} timeZone={testTimeZone} />)

    const earlier = screen.getByRole('region', { name: 'Resumos anteriores' })
    const rows = within(earlier).getAllByRole('row')
    expect(
      within(rows[0] ?? earlier)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Período', 'Atenção', 'Registros'])
    const toggle = within(earlier).getByRole('button', { name: /1\s–\s7 de out\. de 2026/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(earlier).toHaveTextContent('Sem sinais de atenção')
    expect(earlier).toHaveTextContent('Urgente')
    expect(screen.queryByText('Humor estável, sem conteúdo de risco.')).not.toBeInTheDocument()

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Humor estável, sem conteúdo de risco.')).toBeVisible()

    await user.click(within(earlier).getByRole('button', { name: /15\s–\s21 de out\. de 2026/ }))

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Nota menciona vontade de se machucar.')).toBeVisible()
    expect(screen.getByText('Nada a destacar.')).toBeVisible()
  })

  it('explains when there is no reading yet', () => {
    renderWithIntl(<ReadingsSection readings={[]} timeZone={testTimeZone} />, { locale: 'en-US' })

    expect(screen.getByRole('region', { name: 'Summaries' })).toHaveTextContent(
      'No summaries for this patient yet. A summary is written every 7 entries',
    )
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
