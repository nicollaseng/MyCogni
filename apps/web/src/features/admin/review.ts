import type { ProfessionalForReview, ReviewProfessionalInput } from '@mycogni/contracts'
import {
  isReviewDue,
  professionalStatuses,
  type ProfessionalCouncil,
  type ProfessionalStatus,
} from '@mycogni/domain'
import type { ActionResult } from '@/shared/lib/actions/result'

export type ReviewDecision = ReviewProfessionalInput['status']

export type Review = (userId: string, input: ReviewProfessionalInput) => Promise<ActionResult<null>>

export const reviewNoteMinLength = 3

export const reviewViews = [...professionalStatuses, 'revalidate'] as const

export type ReviewView = (typeof reviewViews)[number]

export const councilSearches: Readonly<Record<ProfessionalCouncil, string>> = {
  crp: 'https://cadastro.cfp.org.br/',
  crm: 'https://portal.cfm.org.br/busca-medicos/',
}

export const councilNames: Readonly<Record<ProfessionalCouncil, string>> = {
  crp: 'CFP',
  crm: 'CFM',
}

export const checklistItems = ['name', 'registration', 'face', 'active'] as const

export const institutionChecklistItems = ['name', 'institution', 'face'] as const

export type ChecklistItem = (typeof checklistItems)[number] | 'institution'

export function viewOf(value: string | string[] | undefined): ReviewView {
  return reviewViews.find((view) => view === value) ?? 'pending'
}

export function statusOfView(view: ReviewView): ProfessionalStatus {
  return view === 'revalidate' ? 'verified' : view
}

export function professionalsInView(
  professionals: readonly ProfessionalForReview[],
  view: ReviewView,
  now: Date,
): ProfessionalForReview[] {
  return professionals.filter(
    (professional) =>
      view !== 'revalidate' ||
      (professional.verifiedAt !== null && isReviewDue(new Date(professional.verifiedAt), now)),
  )
}

export function checklistOf(council: ProfessionalCouncil | null): readonly ChecklistItem[] {
  return council === null ? institutionChecklistItems : checklistItems
}

export function canApprove(
  professional: Pick<ProfessionalForReview, 'document' | 'hasPhoto'>,
): boolean {
  return professional.document !== null && professional.hasPhoto
}
