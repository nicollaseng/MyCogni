import {
  assignmentDetailSchema,
  patientQuestionnairesSchema,
  professionalAssignmentListSchema,
  professionalAssignmentSchema,
  questionnaireCatalogSchema,
  questionnaireRunSchema,
  type AssignmentDetail,
  type CreateAssignmentInput,
  type PatientQuestionnaires,
  type ProfessionalAssignment,
  type QuestionnaireCatalog,
  type QuestionnaireRun,
} from '@mycogni/contracts'
import type { Locale } from '@mycogni/domain'
import { z } from 'zod'
import { apiRequest } from './client'

function patientPath(patientId: string): `/v1/${string}` {
  return `/v1/professional/patients/${encodeURIComponent(patientId)}/questionnaires`
}

function runPath(id: string): `/v1/${string}` {
  return `/v1/questionnaires/${encodeURIComponent(id)}`
}

export function fetchQuestionnaireCatalog(patientId: string): Promise<QuestionnaireCatalog> {
  return apiRequest({
    path: `${patientPath(patientId)}/catalog`,
    schema: questionnaireCatalogSchema,
  })
}

export function fetchPatientAssignments(patientId: string): Promise<ProfessionalAssignment[]> {
  return apiRequest({ path: patientPath(patientId), schema: professionalAssignmentListSchema })
}

export function fetchAssignmentDetail(
  patientId: string,
  assignmentId: string,
): Promise<AssignmentDetail> {
  return apiRequest({
    path: `${patientPath(patientId)}/${encodeURIComponent(assignmentId)}`,
    schema: assignmentDetailSchema,
  })
}

export function releaseQuestionnaire(
  patientId: string,
  input: CreateAssignmentInput,
): Promise<ProfessionalAssignment> {
  return apiRequest({
    path: patientPath(patientId),
    schema: professionalAssignmentSchema,
    method: 'POST',
    body: input,
  })
}

export async function cancelAssignment(patientId: string, assignmentId: string): Promise<void> {
  await apiRequest({
    path: `${patientPath(patientId)}/${encodeURIComponent(assignmentId)}/cancel`,
    schema: z.null(),
    method: 'POST',
  })
}

export function fetchMyQuestionnaires(): Promise<PatientQuestionnaires> {
  return apiRequest({ path: '/v1/questionnaires', schema: patientQuestionnairesSchema })
}

export function fetchQuestionnaireRun(id: string): Promise<QuestionnaireRun> {
  return apiRequest({ path: runPath(id), schema: questionnaireRunSchema })
}

export function startQuestionnaire(id: string, locale: Locale): Promise<QuestionnaireRun> {
  return apiRequest({
    path: `${runPath(id)}/start`,
    schema: questionnaireRunSchema,
    method: 'POST',
    body: { locale },
  })
}

export function answerQuestionnaire(
  id: string,
  item: number,
  value: number,
): Promise<QuestionnaireRun> {
  return apiRequest({
    path: `${runPath(id)}/answers`,
    schema: questionnaireRunSchema,
    method: 'PATCH',
    body: { item, value },
  })
}

export function completeQuestionnaire(id: string): Promise<QuestionnaireRun> {
  return apiRequest({
    path: `${runPath(id)}/complete`,
    schema: questionnaireRunSchema,
    method: 'POST',
  })
}
