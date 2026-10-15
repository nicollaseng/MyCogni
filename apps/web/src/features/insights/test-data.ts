import type { PatientInsight, ProfessionalInsight } from '@mycogni/contracts'

export const testTimeZone = 'America/Sao_Paulo'

export function patientReading(
  day: number,
  overrides: Partial<PatientInsight> = {},
): PatientInsight {
  const end = String(day).padStart(2, '0')
  const start = String(day - 6).padStart(2, '0')
  return {
    id: `6f1c2d3e-4b5a-4c6d-8e7f-${end.padStart(12, '0')}`,
    periodStart: `2026-10-${start}T13:00:00Z`,
    periodEnd: `2026-10-${end}T22:00:00Z`,
    checkInCount: 7,
    createdAt: `2026-10-${end}T22:05:00Z`,
    content: {
      summary: 'Sua semana terminou mais leve. O humor médio subiu de 3,0 para 4,1.',
      highlights: ['Você dormiu bem em quatro das sete noites.'],
      suggestions: [
        {
          title: 'Proteger o horário de dormir',
          detail: 'As noites bem dormidas vieram antes dos seus melhores dias.',
        },
      ],
    },
    ...overrides,
  }
}

export function professionalReading(
  day: number,
  overrides: Partial<ProfessionalInsight['content']> = {},
): ProfessionalInsight {
  const end = String(day).padStart(2, '0')
  const start = String(day - 6).padStart(2, '0')
  return {
    id: `7a2b3c4d-5e6f-4a7b-8c9d-${end.padStart(12, '0')}`,
    periodStart: `2026-10-${start}T13:00:00Z`,
    periodEnd: `2026-10-${end}T22:00:00Z`,
    checkInCount: 7,
    createdAt: `2026-10-${end}T22:05:00Z`,
    content: {
      summary: 'Melhora consistente do humor no período.',
      trends: ['Média de humor 4,1, alta de 0,8.'],
      themes: ['Sono', 'Trabalho'],
      attention: 'none',
      attentionReason: null,
      ...overrides,
    },
  }
}
