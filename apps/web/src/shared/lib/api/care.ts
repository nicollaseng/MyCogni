import {
  assessmentListSchema,
  careLinkListSchema,
  careLinkSchema,
  checkInListSchema,
  createdInvitationSchema,
  invitationPreviewSchema,
  notificationListSchema,
  patientSummaryListSchema,
  patientSummarySchema,
  professionalForReviewListSchema,
  professionalOverviewSchema,
  professionalInsightListSchema,
  professionalProfileSchema,
  receivedInvitationListSchema,
  receivedInvitationSchema,
  sentInvitationListSchema,
  attachedInvitationsSchema,
  documentLinkSchema,
  type AcceptInvitationInput,
  type Assessment,
  type CareLink,
  type CheckIn,
  type ConfirmSharingTermsInput,
  type CreatedInvitation,
  type CreateInvitationInput,
  type DocumentLink,
  type InvitationPreview,
  type NotificationList,
  type PatientSummary,
  type ProfessionalForReview,
  type ProfessionalInsight,
  type ProfessionalOverview,
  type ProfessionalProfile,
  type ReceivedInvitation,
  type RegisterProfessionalInput,
  type ReviewProfessionalInput,
  type SentInvitation,
  type SubmitProfessionalDocumentInput,
  type UpdateProfessionalInput,
} from '@mycogni/contracts'
import type { Locale, ProfessionalStatus } from '@mycogni/domain'
import { cache } from 'react'
import { z } from 'zod'
import { ApiError, apiRequest } from './client'

export async function fetchInvitationPreview(code: string): Promise<InvitationPreview | null> {
  try {
    return await apiRequest({
      path: `/v1/public/invitations/preview/${encodeURIComponent(code)}`,
      schema: invitationPreviewSchema,
      anonymous: true,
    })
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return null
    }
    throw error
  }
}

export function claimInvitation(code: string): Promise<ReceivedInvitation> {
  return apiRequest({
    path: '/v1/invitations/claim',
    schema: receivedInvitationSchema,
    method: 'POST',
    body: { code },
  })
}

export async function attachInvitations(): Promise<number> {
  const result = await apiRequest({
    path: '/v1/invitations/attach',
    schema: attachedInvitationsSchema,
    method: 'POST',
  })
  return result.attached
}

export function fetchReceivedInvitations(): Promise<ReceivedInvitation[]> {
  return apiRequest({ path: '/v1/invitations/received', schema: receivedInvitationListSchema })
}

export async function fetchReceivedInvitation(id: string): Promise<ReceivedInvitation | null> {
  try {
    return await apiRequest({
      path: `/v1/invitations/received/${encodeURIComponent(id)}`,
      schema: receivedInvitationSchema,
    })
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return null
    }
    throw error
  }
}

export function acceptInvitation(id: string, body: AcceptInvitationInput): Promise<CareLink> {
  return apiRequest({
    path: `/v1/invitations/${encodeURIComponent(id)}/accept`,
    schema: careLinkSchema,
    method: 'POST',
    body,
  })
}

export async function declineInvitation(id: string): Promise<void> {
  await apiRequest({
    path: `/v1/invitations/${encodeURIComponent(id)}/decline`,
    schema: z.null(),
    method: 'POST',
  })
}

export function fetchCareLinks(): Promise<CareLink[]> {
  return apiRequest({ path: '/v1/care-links', schema: careLinkListSchema })
}

export async function endCareLink(id: string): Promise<void> {
  await apiRequest({
    path: `/v1/care-links/${encodeURIComponent(id)}/end`,
    schema: z.null(),
    method: 'POST',
  })
}

export async function confirmSharingTerms(
  id: string,
  body: ConfirmSharingTermsInput,
): Promise<void> {
  await apiRequest({
    path: `/v1/care-links/${encodeURIComponent(id)}/terms`,
    schema: z.null(),
    method: 'POST',
    body,
  })
}

export const fetchNotifications = cache((): Promise<NotificationList> =>
  apiRequest({ path: '/v1/notifications', schema: notificationListSchema }),
)

export function preloadNotifications(): void {
  fetchNotifications().catch(() => undefined)
}

export async function markNotificationsRead(ids?: string[]): Promise<void> {
  await apiRequest({
    path: '/v1/notifications/read',
    schema: z.null(),
    method: 'POST',
    body: ids === undefined ? {} : { ids },
  })
}

export const fetchProfessional = cache(async (): Promise<ProfessionalProfile | null> => {
  try {
    return await apiRequest({ path: '/v1/professional', schema: professionalProfileSchema })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
})

export function registerProfessional(
  body: RegisterProfessionalInput,
): Promise<ProfessionalProfile> {
  return apiRequest({
    path: '/v1/professional',
    schema: professionalProfileSchema,
    method: 'POST',
    body,
  })
}

export function updateProfessional(body: UpdateProfessionalInput): Promise<ProfessionalProfile> {
  return apiRequest({
    path: '/v1/professional',
    schema: professionalProfileSchema,
    method: 'PATCH',
    body,
  })
}

export function createInvitation(body: CreateInvitationInput): Promise<CreatedInvitation> {
  return apiRequest({
    path: '/v1/invitations',
    schema: createdInvitationSchema,
    method: 'POST',
    body,
  })
}

export function resendInvitation(id: string, locale: Locale): Promise<CreatedInvitation> {
  return apiRequest({
    path: `/v1/invitations/${encodeURIComponent(id)}/resend`,
    schema: createdInvitationSchema,
    method: 'POST',
    body: { locale },
  })
}

export async function cancelInvitation(id: string): Promise<void> {
  await apiRequest({
    path: `/v1/invitations/${encodeURIComponent(id)}/cancel`,
    schema: z.null(),
    method: 'POST',
  })
}

export function fetchSentInvitations(): Promise<SentInvitation[]> {
  return apiRequest({ path: '/v1/invitations/sent', schema: sentInvitationListSchema })
}

export function fetchProfessionalOverview(): Promise<ProfessionalOverview> {
  return apiRequest({ path: '/v1/professional/overview', schema: professionalOverviewSchema })
}

export function fetchPatients(): Promise<PatientSummary[]> {
  return apiRequest({ path: '/v1/professional/patients', schema: patientSummaryListSchema })
}

export async function fetchPatient(patientId: string): Promise<PatientSummary | null> {
  try {
    return await apiRequest({
      path: `/v1/professional/patients/${encodeURIComponent(patientId)}`,
      schema: patientSummarySchema,
    })
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return null
    }
    throw error
  }
}

export function fetchPatientCheckIns(patientId: string, since: Date): Promise<CheckIn[]> {
  const query = new URLSearchParams({ since: since.toISOString(), limit: '200' })
  return apiRequest({
    path: `/v1/professional/patients/${encodeURIComponent(patientId)}/check-ins?${query.toString()}`,
    schema: checkInListSchema,
  })
}

export function fetchPatientAssessments(patientId: string): Promise<Assessment[]> {
  return apiRequest({
    path: `/v1/professional/patients/${encodeURIComponent(patientId)}/assessments`,
    schema: assessmentListSchema,
  })
}

export function fetchPatientInsights(patientId: string): Promise<ProfessionalInsight[]> {
  return apiRequest({
    path: `/v1/professional/patients/${encodeURIComponent(patientId)}/insights`,
    schema: professionalInsightListSchema,
  })
}

export async function fetchProfessionalsForReview(
  status: ProfessionalStatus,
): Promise<ProfessionalForReview[] | null> {
  try {
    return await apiRequest({
      path: `/v1/admin/professionals?status=${status}`,
      schema: professionalForReviewListSchema,
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return null
    }
    throw error
  }
}

export async function reviewProfessional(
  userId: string,
  body: ReviewProfessionalInput,
): Promise<void> {
  await apiRequest({
    path: `/v1/admin/professionals/${encodeURIComponent(userId)}/review`,
    schema: z.null(),
    method: 'POST',
    body,
  })
}

export function submitProfessionalDocument(
  body: SubmitProfessionalDocumentInput,
): Promise<ProfessionalProfile> {
  return apiRequest({
    path: '/v1/professional/documents',
    schema: professionalProfileSchema,
    method: 'POST',
    body,
  })
}

export async function fetchDocumentLink(id: string): Promise<DocumentLink | null> {
  try {
    return await apiRequest({
      path: `/v1/admin/documents/${encodeURIComponent(id)}/link`,
      schema: documentLinkSchema,
    })
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      return null
    }
    throw error
  }
}
