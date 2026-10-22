import {
  assignmentNoteMaxLength,
  assignmentStatuses,
  bandIds,
  clusterIds,
  locales,
  openAssignmentStatuses,
  plainLevels,
  questionnaireAreas,
  questionnaireFlags,
  questionnaireInstruments,
  questionnaireUses,
  questionnaireVariants,
  repeatIntervals,
  satepsiStatuses,
  unavailableReasons,
} from '@mycogni/domain'
import { z } from 'zod'
import { professionalKindSchema } from './professionals.ts'

const timestamp = z.iso.datetime({ offset: true })

const count = z.int().min(0)

export const questionnaireVariantSchema = z.enum(questionnaireVariants)

export const questionnaireCatalogOptionSchema = z.object({
  variant: questionnaireVariantSchema,
  instrument: z.enum(questionnaireInstruments),
  name: z.string(),
  itemCount: z.int().positive(),
  minutes: z.int().positive(),
  uses: z.array(z.enum(questionnaireUses)),
  primary: z.boolean(),
  safetyItem: z.boolean(),
  satepsi: z.object({ status: z.enum(satepsiStatuses), checkedOn: z.iso.date() }),
  unavailableReason: z.enum(unavailableReasons).nullable(),
})

export type QuestionnaireCatalogOption = z.infer<typeof questionnaireCatalogOptionSchema>

export const questionnaireCatalogSchema = z.object({
  patientLocale: z.enum(locales),
  complementarySource: z.boolean(),
  areas: z.array(
    z.object({
      area: z.enum(questionnaireAreas),
      options: z.array(questionnaireCatalogOptionSchema),
    }),
  ),
})

export type QuestionnaireCatalog = z.infer<typeof questionnaireCatalogSchema>

export const repeatIntervalSchema = z.literal(repeatIntervals)

export const createAssignmentSchema = z.object({
  variant: questionnaireVariantSchema,
  note: z
    .string()
    .trim()
    .max(assignmentNoteMaxLength)
    .transform((note) => (note === '' ? null : note))
    .nullable()
    .default(null),
  repeatEveryDays: repeatIntervalSchema.nullable().default(null),
})

export type CreateAssignmentInput = z.input<typeof createAssignmentSchema>

export const questionnaireScoreSchema = z.object({
  total: z.int(),
  min: z.int(),
  max: z.int(),
  band: z.enum(bandIds),
  clusters: z.array(
    z.object({
      id: z.enum(clusterIds),
      total: count,
      max: count,
      endorsed: count,
      required: count,
    }),
  ),
  provisional: z.boolean().nullable(),
  shaded: z.object({ count, positive: z.boolean() }).nullable(),
})

export type QuestionnaireScoreView = z.infer<typeof questionnaireScoreSchema>

const flagsSchema = z.array(z.enum(questionnaireFlags))

export const professionalAssignmentSchema = z.object({
  id: z.uuid(),
  patientId: z.uuid(),
  variant: questionnaireVariantSchema,
  instrument: z.enum(questionnaireInstruments),
  status: z.enum(assignmentStatuses),
  note: z.string().nullable(),
  repeatEveryDays: repeatIntervalSchema.nullable(),
  availableFrom: timestamp,
  createdAt: timestamp,
  completedAt: timestamp.nullable(),
  cancelledAt: timestamp.nullable(),
  result: z
    .object({
      total: z.int(),
      max: z.int(),
      band: z.enum(bandIds),
      flags: flagsSchema,
    })
    .nullable(),
})

export type ProfessionalAssignment = z.infer<typeof professionalAssignmentSchema>

export const professionalAssignmentListSchema = z.array(professionalAssignmentSchema)

export const assignmentDetailSchema = z.object({
  assignment: professionalAssignmentSchema,
  complementarySource: z.boolean(),
  response: z
    .object({
      locale: z.enum(locales),
      instrumentVersion: z.string(),
      consentedAt: timestamp,
      startedAt: timestamp,
      completedAt: timestamp,
      answers: z.array(z.int()),
      score: questionnaireScoreSchema,
      flags: flagsSchema,
    })
    .nullable(),
  trend: z.array(
    z.object({
      assignmentId: z.uuid(),
      completedAt: timestamp,
      total: z.int(),
      band: z.enum(bandIds),
    }),
  ),
})

export type AssignmentDetail = z.infer<typeof assignmentDetailSchema>

const assignedBySchema = z.object({ name: z.string(), kind: professionalKindSchema })

export const plainQuestionnaireSummarySchema = z.object({
  area: z.enum(questionnaireAreas),
  level: z.enum(plainLevels),
  safety: z.boolean(),
})

export type PlainQuestionnaireSummaryView = z.infer<typeof plainQuestionnaireSummarySchema>

export const patientAssignmentSchema = z.object({
  id: z.uuid(),
  area: z.enum(questionnaireAreas),
  status: z.enum(openAssignmentStatuses),
  itemCount: z.int().positive(),
  minutes: z.int().positive(),
  answered: count,
  note: z.string().nullable(),
  availableFrom: timestamp,
  professional: assignedBySchema,
})

export type PatientAssignment = z.infer<typeof patientAssignmentSchema>

export const answeredQuestionnaireSchema = z.object({
  id: z.uuid(),
  area: z.enum(questionnaireAreas),
  completedAt: timestamp,
  summary: plainQuestionnaireSummarySchema,
  professional: assignedBySchema,
})

export type AnsweredQuestionnaire = z.infer<typeof answeredQuestionnaireSchema>

export const patientQuestionnairesSchema = z.object({
  open: z.array(patientAssignmentSchema),
  answered: z.array(answeredQuestionnaireSchema),
})

export type PatientQuestionnaires = z.infer<typeof patientQuestionnairesSchema>

export const questionnaireContentSchema = z.object({
  locale: z.enum(locales),
  lead: z.string(),
  stem: z.string().nullable(),
  items: z.array(z.string()),
  standaloneItems: z.array(count),
  options: z.array(z.object({ label: z.string(), value: z.int() })),
  notice: z.string().nullable(),
})

export type QuestionnaireContent = z.infer<typeof questionnaireContentSchema>

export const questionnaireRunSchema = z.object({
  id: z.uuid(),
  area: z.enum(questionnaireAreas),
  status: z.enum(assignmentStatuses),
  itemCount: z.int().positive(),
  minutes: z.int().positive(),
  note: z.string().nullable(),
  professional: assignedBySchema,
  content: questionnaireContentSchema.nullable(),
  answers: z.array(z.int().nullable()),
  summary: plainQuestionnaireSummarySchema.nullable(),
})

export type QuestionnaireRun = z.infer<typeof questionnaireRunSchema>

export const startQuestionnaireSchema = z.object({ locale: z.enum(locales) })

export type StartQuestionnaireInput = z.infer<typeof startQuestionnaireSchema>

export const answerQuestionnaireSchema = z.object({
  item: z.int().min(0).max(99),
  value: z.int().min(0).max(10),
})

export type AnswerQuestionnaireInput = z.infer<typeof answerQuestionnaireSchema>
