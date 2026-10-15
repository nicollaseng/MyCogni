import { describe, expect, it } from '@jest/globals'
import {
  buildReportModel,
  type ReportCheckIn,
  type ReportInput,
  type ReportReading,
  type ReportScreening,
} from '../../src/modules/reports/report-model.ts'

const timeZone = 'America/Sao_Paulo'
const now = new Date('2026-10-15T18:00:00Z')

function daysAgo(days: number, hour = 15): Date {
  const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  date.setUTCHours(hour, 0, 0, 0)
  return date
}

function checkIn(
  days: number,
  moodLevel: number,
  extra: Partial<ReportCheckIn> = {},
): ReportCheckIn {
  return {
    moodLevel,
    emotions: [],
    contexts: [],
    note: null,
    recordedAt: daysAgo(days),
    ...extra,
  }
}

function input(overrides: Partial<ReportInput> = {}): ReportInput {
  return {
    locale: 'pt-BR',
    timeZone,
    now,
    days: 7,
    name: 'Marina Costa',
    checkIns: [],
    screenings: [],
    readings: [],
    includeNotes: false,
    ...overrides,
  }
}

const week = [
  checkIn(0, 5, {
    emotions: ['calm', 'gratitude'],
    contexts: ['exercise'],
    note: 'Caminhei cedo.',
  }),
  checkIn(1, 4, { emotions: ['calm'], contexts: ['work'] }),
  checkIn(1, 2, { emotions: ['anxiety'], contexts: ['work'], recordedAt: daysAgo(1, 22) }),
  checkIn(3, 5, { emotions: ['calm', 'saudade de casa'], contexts: ['friends'] }),
  checkIn(5, 4, { note: 'Dia corrido no trabalho.' }),
  checkIn(8, 2, { note: 'Fora do período.' }),
  checkIn(10, 3),
  checkIn(12, 2),
]

const patientReading: ReportReading = {
  audience: 'patient',
  periodStart: daysAgo(9),
  periodEnd: daysAgo(2),
  content: {
    summary: 'Uma semana mais leve que a anterior.',
    highlights: ['Os dias com exercício foram os melhores.'],
    suggestions: [{ title: 'Caminhar cedo', detail: 'Repita nas manhãs de semana.' }],
  },
}

describe('buildReportModel', () => {
  it('sums up the period with days, average and the change from the period before', () => {
    const model = buildReportModel(input({ checkIns: week }))

    expect(model.header).toEqual({
      name: 'Marina Costa',
      scope: 'Últimos 7 dias',
      period: '9 – 15 de outubro de 2026',
      generated: 'Gerado em 15 de outubro de 2026',
    })
    expect(model.kpis).toEqual([
      { label: 'Dias com registro', value: '4 de 7', detail: '5 registros no período' },
      { label: 'Humor médio', value: '4,3 de 6', detail: 'Um pouco bem' },
      {
        label: 'Em relação aos 7 dias anteriores',
        value: '+1,9',
        detail: 'Acima\nMédia anterior: 2,3',
      },
    ])
  })

  it('names the file after the generation day in the person’s language', () => {
    expect(buildReportModel(input()).fileName).toBe('mycogni-relatorio-2026-10-15.pdf')
    expect(buildReportModel(input({ locale: 'en-US' })).fileName).toBe(
      'mycogni-report-2026-10-15.pdf',
    )
  })

  it('charts the daily average of every day, labelling each day of a week', () => {
    const { chart } = buildReportModel(input({ checkIns: week }))

    expect(chart.points.map((point) => point.average)).toEqual([null, 4, null, 5, null, 3, 5])
    expect(chart.points.map((point) => point.label)).toEqual([
      'sex., 9',
      'sáb., 10',
      'dom., 11',
      'seg., 12',
      'ter., 13',
      'qua., 14',
      'qui., 15',
    ])
    expect(chart.scale).toEqual({ top: 'Muito bem', middle: 'Neutro', bottom: 'Muito mal' })
    expect(chart.empty).toBeNull()
  })

  it('labels a month weekly, ending on the last day', () => {
    const { chart, kpis } = buildReportModel(input({ days: 30, checkIns: week }))

    expect(chart.points).toHaveLength(30)
    expect(chart.points.flatMap((point) => (point.label === null ? [] : [point.label]))).toEqual([
      '17 de set.',
      '24 de set.',
      '1 de out.',
      '8 de out.',
      '15 de out.',
    ])
    expect(kpis[0]?.value).toBe('7 de 30')
    expect(kpis[2]).toEqual({
      label: 'Em relação aos 30 dias anteriores',
      value: '—',
      detail: 'Poucos dias com registro para comparar',
    })
  })

  it('ranks emotions and contexts of the period with catalog labels', () => {
    const { frequent } = buildReportModel(input({ checkIns: week }))

    expect(frequent.columns).toEqual([
      {
        title: 'Emoções',
        rows: [
          { label: 'calma', count: 3, countLabel: '3 registros' },
          { label: 'ansiedade', count: 1, countLabel: '1 registro' },
          { label: 'gratidão', count: 1, countLabel: '1 registro' },
          { label: 'saudade de casa', count: 1, countLabel: '1 registro' },
        ],
      },
      {
        title: 'Contextos',
        rows: [
          { label: 'trabalho', count: 2, countLabel: '2 registros' },
          { label: 'exercício', count: 1, countLabel: '1 registro' },
          { label: 'amizades', count: 1, countLabel: '1 registro' },
        ],
      },
    ])
    expect(frequent.empty).toBeNull()
  })

  it('keeps the latest questionnaire of each kind answered within the period', () => {
    const screenings: ReportScreening[] = [
      { instrument: 'phq9', totalScore: 12, severity: 'moderate', completedAt: daysAgo(6) },
      { instrument: 'phq9', totalScore: 7, severity: 'mild', completedAt: daysAgo(2) },
      { instrument: 'gad7', totalScore: 16, severity: 'severe', completedAt: daysAgo(20) },
    ]

    const { screenings: section } = buildReportModel(input({ screenings }))

    expect(section.rows).toHaveLength(1)
    const [row] = section.rows
    expect(row).toEqual(
      expect.objectContaining({
        name: 'PHQ-9',
        topic: 'Sinais de depressão',
        score: '7 de 27',
        severity: 'Leve',
        date: 'Respondido em 13 de outubro de 2026',
      }),
    )
    expect(row?.bands.map((band) => band.active)).toEqual([false, true, false, false, false])
    expect(row?.bands.reduce((sum, band) => sum + band.share, 0)).toBeCloseTo(1)
  })

  it('uses the official band names of each language', () => {
    const screenings: ReportScreening[] = [
      { instrument: 'gad7', totalScore: 6, severity: 'mild', completedAt: daysAgo(1) },
    ]

    expect(buildReportModel(input({ locale: 'pt-PT', screenings })).screenings.rows[0]).toEqual(
      expect.objectContaining({ severity: 'Ligeira', score: '6 de 21' }),
    )
    expect(buildReportModel(input({ locale: 'en-US', screenings })).screenings.rows[0]).toEqual(
      expect.objectContaining({ severity: 'Mild', topic: 'Signs of anxiety' }),
    )
  })

  it('brings the latest summary that ends within the period, marked as automatic', () => {
    const older: ReportReading = {
      ...patientReading,
      periodEnd: daysAgo(4),
      content: { ...patientReading.content, summary: 'Mais antiga.' },
    }
    const outside: ReportReading = { ...patientReading, periodEnd: daysAgo(9) }

    const { reading } = buildReportModel(input({ readings: [older, patientReading, outside] }))

    expect(reading).toEqual({
      title: 'Resumo do período',
      notice: 'Escrito automaticamente a partir dos registros. Não é um diagnóstico.',
      covers: 'Sobre os registros de 6 – 13 de outubro de 2026',
      summary: 'Uma semana mais leve que a anterior.',
      attention: null,
      sections: [
        {
          title: 'O que se destacou',
          items: [{ lead: null, text: 'Os dias com exercício foram os melhores.' }],
        },
        {
          title: 'Para os próximos dias',
          items: [{ lead: 'Caminhar cedo', text: 'Repita nas manhãs de semana.' }],
        },
      ],
    })
    expect(buildReportModel(input({ readings: [outside] })).reading).toBeNull()
  })

  it('shows the professional summary with its attention level', () => {
    const reading: ReportReading = {
      audience: 'professional',
      periodStart: daysAgo(9),
      periodEnd: daysAgo(2),
      content: {
        summary: 'Humor estável.',
        trends: ['Média 4,1.'],
        themes: [],
        attention: 'watch',
        attentionReason: 'GAD-7 subiu.',
      },
    }

    expect(buildReportModel(input({ readings: [reading] })).reading).toEqual(
      expect.objectContaining({
        title: 'Resumo do período',
        notice:
          'Escrito automaticamente a partir dos registros compartilhados com você, sem o MyBook. Não faz diagnóstico.',
        attention: 'Atenção: observar. GAD-7 subiu.',
        sections: [{ title: 'Tendências', items: [{ lead: null, text: 'Média 4,1.' }] }],
      }),
    )
    expect(
      buildReportModel(
        input({ readings: [{ ...reading, content: { ...reading.content, attention: 'none' } }] }),
      ).reading?.attention,
    ).toBeNull()
  })

  it('leaves the notes out unless they were asked for', () => {
    expect(buildReportModel(input({ checkIns: week })).notes).toBeNull()

    const { notes } = buildReportModel(input({ checkIns: week, includeNotes: true }))

    expect(notes?.entries.map((entry) => entry.text)).toEqual([
      'Dia corrido no trabalho.',
      'Caminhei cedo.',
    ])
    expect(notes?.entries[0]).toEqual(
      expect.objectContaining({ date: 'sáb., 10 de out., 12:00', mood: 'Um pouco bem', level: 4 }),
    )
    expect(notes?.empty).toBeNull()
  })

  it('says plainly when the period has no records', () => {
    const model = buildReportModel(input({ locale: 'pt-PT', includeNotes: true }))

    expect(model.kpis.map((kpi) => [kpi.value, kpi.detail])).toEqual([
      ['0 de 7', '0 registos no período'],
      ['—', 'Sem registos no período'],
      ['—', 'Poucos dias com registo para comparar'],
    ])
    expect(model.chart.empty).toBe('Nenhum registo neste período.')
    expect(model.frequent.empty).toBe('Nada registado neste período.')
    expect(model.screenings.empty).toBe('Nenhum questionário respondido neste período.')
    expect(model.notes).toEqual({
      title: 'Notas',
      entries: [],
      empty: 'Nenhuma nota neste período.',
    })
    expect(model.reading).toBeNull()
  })

  it('speaks English with local dates and the crisis lines of the country', () => {
    const american = buildReportModel(input({ locale: 'en-US', checkIns: week }))
    const british = buildReportModel(input({ locale: 'en-GB', checkIns: week, name: null }))

    expect(american.header.period).toBe('October 9 – 15, 2026')
    expect(american.kpis[1]).toEqual({
      label: 'Average mood',
      value: '4.3 of 6',
      detail: 'Slightly good',
    })
    expect(american.footer.crisis).toMatch(/^In a crisis, call 988 /)
    expect(american.footer.page(2, 3)).toBe('2 of 3')
    expect(british.header).toEqual(
      expect.objectContaining({
        name: 'Person without a name on file',
        period: '9 – 15 October 2026',
        generated: 'Generated on 15 October 2026',
      }),
    )
    expect(british.footer.crisis).toContain('116 123 (Samaritans, free, 24/7)')
  })

  it('lists the crisis lines and the disclaimer in Portuguese', () => {
    const { footer } = buildReportModel(input())

    expect(footer.disclaimer).toBe(
      'Este relatório não é um diagnóstico e não substitui o acompanhamento de um profissional de saúde.',
    )
    expect(footer.crisis).toBe(
      'Em crise, ligue 188 (CVV, 24 horas, gratuito) · 192 (SAMU, emergência)',
    )
    expect(footer.page(1, 2)).toBe('1 de 2')
  })
})
