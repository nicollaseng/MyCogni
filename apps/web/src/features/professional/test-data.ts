import type {
  ActivityDay,
  PatientSummary,
  ProfessionalAlert,
  ProfessionalDocument,
  ProfessionalOverview,
  ProfessionalProfile,
  ScreeningSummary,
  SentInvitation,
} from '@mycogni/contracts'
import { previousDays } from '@mycogni/domain'

export const testNow = new Date('2026-10-15T15:00:00Z')

export const testTimeZone = 'America/Sao_Paulo'

let sequence = 0

function nextId(): string {
  sequence += 1
  return `0b7c6c8e-6a8f-4f53-9f4b-${String(sequence).padStart(12, '0')}`
}

export function screening(overrides: Partial<ScreeningSummary> = {}): ScreeningSummary {
  return {
    instrument: 'phq9',
    totalScore: 4,
    severity: 'minimal',
    hasRiskFlag: false,
    completedAt: '2026-10-10T13:00:00Z',
    ...overrides,
  }
}

export function patient(overrides: Partial<PatientSummary> = {}): PatientSummary {
  return {
    id: nextId(),
    linkId: nextId(),
    name: 'Marina Costa',
    photoUrl: null,
    startedAt: '2026-09-01T12:00:00Z',
    sharesHistory: false,
    lastCheckIn: { moodLevel: 5, recordedAt: '2026-10-14T21:00:00Z' },
    checkInsLastWeek: 4,
    checkInsLast30Days: 12,
    moodAverage: 4.2,
    previousMoodAverage: 4,
    screenings: [],
    attention: [],
    termsOutdated: false,
    ...overrides,
  }
}

export function activity(counts: readonly number[]): ActivityDay[] {
  const days = previousDays('2026-10-15', counts.length)
  return days.map((day, index) => {
    const checkIns = counts[index] ?? 0
    return {
      day,
      checkIns,
      patients: Math.min(checkIns, 3),
      moodAverage: checkIns === 0 ? null : 3.5,
    }
  })
}

export function overview(overrides: Partial<ProfessionalOverview> = {}): ProfessionalOverview {
  return {
    activity: activity(Array.from({ length: 30 }, () => 0)),
    recent: [],
    invitations: { pending: 0, expiringSoon: 0 },
    ...overrides,
  }
}

export function invitation(overrides: Partial<SentInvitation> = {}): SentInvitation {
  return {
    id: nextId(),
    code: 'K7M2X9QA',
    channel: 'email',
    recipientEmail: 'marina@exemplo.com',
    status: 'pending',
    createdAt: '2026-10-15T12:00:00Z',
    expiresAt: '2026-10-18T12:00:00Z',
    respondedAt: null,
    link: 'http://localhost:3000/invite/K7M2X9QA',
    ...overrides,
  }
}

export function alert(overrides: Partial<ProfessionalAlert> = {}): ProfessionalAlert {
  return {
    id: nextId(),
    patientId: nextId(),
    patientName: 'Marina Costa',
    patientPhotoUrl: null,
    reason: 'low_mood',
    level: 'watch',
    status: 'open',
    createdAt: '2026-10-15T12:00:00Z',
    acknowledgedAt: null,
    resolvedAt: null,
    checkInId: null,
    journalEntryId: null,
    ...overrides,
  }
}

export function registrationDocument(
  overrides: Partial<ProfessionalDocument> = {},
): ProfessionalDocument {
  return {
    id: nextId(),
    fileName: 'Carteira CRP.pdf',
    contentType: 'application/pdf',
    sizeBytes: 120 * 1024,
    createdAt: '2026-10-15T12:00:00Z',
    ...overrides,
  }
}

export function professionalProfile(
  overrides: Partial<ProfessionalProfile> = {},
): ProfessionalProfile {
  return {
    kind: 'psychologist',
    fullName: 'Helena Prado',
    registration: 'CRP 06/123456',
    status: 'pending',
    reviewNote: null,
    createdAt: '2026-10-14T12:00:00Z',
    verifiedAt: null,
    reviewedAt: null,
    document: null,
    ...overrides,
  }
}
