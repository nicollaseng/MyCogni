import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { newcomer, patternsOf, patternsZone, richHistory } from '../test-data'
import { PatternsOverview } from './patterns-overview'

function sectionNames(): string[] {
  return screen.getAllByRole('region').map((region) => region.getAttribute('aria-label') ?? '')
}

describe('PatternsOverview', () => {
  it('greets someone new with one action and what is on the way, nothing else', () => {
    renderWithIntl(<PatternsOverview model={patternsOf(30, newcomer)} timeZone={patternsZone} />)

    expect(screen.getByRole('link', { name: 'Fazer um check-in' })).toHaveAttribute(
      'href',
      '/check-in',
    )
    expect(screen.queryByRole('navigation', { name: 'Período' })).not.toBeInTheDocument()
    expect(sectionNames()).toEqual(['Em breve'])
    const upcoming = screen.getByRole('region', { name: 'Em breve' })
    expect(
      within(upcoming)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Dias da semana0 de 14 dias',
      'Emoções e contextos0 de 5 registros',
      'O que acompanha seus dias0 de 8 dias',
      'Ânimo e ansiedade1 de 2 respostas',
    ])
    expect(within(upcoming).queryByText('Resumo automático')).not.toBeInTheDocument()
    expect(screen.queryByText(/Não é um diagnóstico/)).not.toBeInTheDocument()
  })

  it('shows every section, compactly, once there are two months of records', () => {
    renderWithIntl(<PatternsOverview model={patternsOf(30)} timeZone={patternsZone} />)

    expect(sectionNames()).toEqual([
      'Em resumo',
      'Seu humor',
      'Resumo automático',
      'O que acompanha seus dias melhores',
      'Dias da semana',
      'Emoções e contextos',
      'Ânimo e ansiedade',
    ])
    const summary = screen.getByRole('region', { name: 'Em resumo' })
    expect(summary).toHaveTextContent('Dias com registro26 de 30')
    expect(summary).toHaveTextContent('Sequência atual: 3 dias')
    expect(summary).toHaveTextContent('Parecido com os 30 dias anteriores')
    const associations = screen.getByRole('region', { name: 'O que acompanha seus dias melhores' })
    expect(associations).toHaveTextContent('exercício')
    expect(
      within(associations).getByRole('heading', { name: 'E nos dias mais difíceis' }),
    ).toBeVisible()
    expect(associations).toHaveTextContent('trabalho')
    expect(screen.getAllByText(/Não é um diagnóstico/)).toHaveLength(1)
    expect(screen.queryByRole('region', { name: 'Em breve' })).not.toBeInTheDocument()
  })

  it('switches every section to the chosen period', () => {
    const { unmount } = renderWithIntl(
      <PatternsOverview model={patternsOf(7)} timeZone={patternsZone} />,
    )

    const periods = screen.getByRole('navigation', { name: 'Período' })
    expect(within(periods).getByRole('link', { name: '7 dias' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(periods).getByRole('link', { name: '90 dias' })).toHaveAttribute(
      'href',
      '/patterns?period=90',
    )
    expect(screen.getByRole('region', { name: 'Em resumo' })).toHaveTextContent('6 de 7')
    expect(screen.queryByRole('region', { name: 'Dias da semana' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'O que acompanha seus dias melhores' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Em breve' })).toHaveTextContent(
      'Ânimo e ansiedade1 de 2 respostas',
    )
    unmount()

    renderWithIntl(<PatternsOverview model={patternsOf(90)} timeZone={patternsZone} />)
    expect(screen.getByRole('region', { name: 'Em resumo' })).toHaveTextContent('51 de 90')
    expect(screen.getByRole('region', { name: 'Ânimo e ansiedade' })).toBeVisible()
  })

  it('collapses what is still locked into one list with progress', () => {
    renderWithIntl(
      <PatternsOverview
        model={patternsOf(30, { checkIns: richHistory(6), readings: [], recentCheckIns: 5 })}
        timeZone={patternsZone}
      />,
    )

    expect(screen.getByRole('region', { name: 'Em resumo' })).toBeVisible()
    expect(screen.getByRole('region', { name: 'Emoções e contextos' })).toBeVisible()
    expect(
      within(screen.getByRole('region', { name: 'Em breve' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Resumo automático5 de 7 registros',
      'Dias da semana5 de 14 dias',
      'O que acompanha seus dias5 de 8 dias',
    ])
  })

  it('says when the period has no records while older ones exist', () => {
    renderWithIntl(
      <PatternsOverview
        model={patternsOf(7, { checkIns: richHistory(30).slice(10) })}
        timeZone={patternsZone}
      />,
    )

    expect(screen.getByText('Nenhum registro nos últimos 7 dias.')).toBeVisible()
    expect(screen.queryByRole('region', { name: 'Em resumo' })).not.toBeInTheDocument()
  })

  it('speaks European Portuguese', () => {
    renderWithIntl(<PatternsOverview model={patternsOf(30, newcomer)} timeZone={patternsZone} />, {
      locale: 'pt-PT',
    })

    expect(screen.getByText('Os seus padrões aparecem aqui à medida que regista.')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Em breve' })).toHaveTextContent(
      'Emoções e contextos0 de 5 registos',
    )
  })
})
