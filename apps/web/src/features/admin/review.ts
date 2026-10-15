import type { ReviewProfessionalInput } from '@mycogni/contracts'
import { professionalStatuses, type ProfessionalStatus } from '@mycogni/domain'
import type { ActionResult } from '@/shared/lib/actions/result'

export type ReviewDecision = ReviewProfessionalInput['status']

export type Review = (userId: string, status: ReviewDecision) => Promise<ActionResult<null>>

export function statusOf(value: string | string[] | undefined): ProfessionalStatus {
  return professionalStatuses.find((status) => status === value) ?? 'pending'
}
