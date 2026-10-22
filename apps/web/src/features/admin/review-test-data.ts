import type { ProfessionalReviewDetail } from '@mycogni/contracts'

export function reviewDetail(
  overrides: Partial<ProfessionalReviewDetail> = {},
): ProfessionalReviewDetail {
  return {
    userId: '0b7c6c8e-6a8f-4f53-9f4b-000000000031',
    kind: 'psychologist',
    fullName: 'Helena Prado',
    registration: 'CRP 06/123456',
    council: 'crp',
    registrationNeedsReview: false,
    email: 'helena@exemplo.com',
    status: 'pending',
    reviewNote: null,
    createdAt: '2026-10-14T12:00:00Z',
    verifiedAt: null,
    reviewedAt: null,
    hasPhoto: true,
    activeLinks: 0,
    pendingInvitations: 0,
    document: {
      id: '0b7c6c8e-6a8f-4f53-9f4b-000000000041',
      fileName: 'Carteira CRP.pdf',
      contentType: 'application/pdf',
      sizeBytes: 245_760,
      createdAt: '2026-10-14T12:05:00Z',
    },
    photoUrl: 'https://exemplo.com/helena.jpg',
    history: [],
    ...overrides,
  }
}
