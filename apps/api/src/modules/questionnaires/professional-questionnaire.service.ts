import type {
  AssignmentDetail,
  CreateAssignmentInput,
  ProfessionalAssignment,
  QuestionnaireCatalog,
} from '@mycogni/contracts'
import {
  catalogEntryOf,
  catalogOfArea,
  isComplementarySource,
  isLocale,
  questionnaireAreas,
  questionnaireForms,
  satepsiCheckedOn,
  unavailableReasonOf,
  type Locale,
  type ProfessionalKind,
  type QuestionnaireVariant,
} from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
} from '../../shared/errors.ts'
import type { ErrorLog } from '../../shared/log.ts'
import type { RateLimit, RateLimiter } from '../../shared/rate-limiter.ts'
import type { ProfessionalRepository } from '../professionals/professional.repository.ts'
import {
  OpenAssignmentError,
  ReleaseRefusedError,
  type PatientLink,
  type ProfessionalQuestionnaireRepository,
} from './professional-questionnaire.repository.ts'
import type { QuestionnaireNotifier } from './questionnaire-notifier.ts'
import {
  knownVariant,
  toProfessionalAssignment,
  toResponseDetail,
  toTrend,
} from './questionnaire.mapper.ts'

export interface ProfessionalQuestionnaireService {
  catalog(user: AuthenticatedUser, patientId: string): Promise<QuestionnaireCatalog>
  create(
    user: AuthenticatedUser,
    patientId: string,
    input: CreateAssignmentInput,
  ): Promise<ProfessionalAssignment>
  list(user: AuthenticatedUser, patientId: string): Promise<ProfessionalAssignment[]>
  detail(
    user: AuthenticatedUser,
    patientId: string,
    assignmentId: string,
  ): Promise<AssignmentDetail>
  cancel(user: AuthenticatedUser, patientId: string, assignmentId: string): Promise<void>
}

export interface ProfessionalQuestionnaireDependencies {
  questionnaires: ProfessionalQuestionnaireRepository
  professionals: ProfessionalRepository
  notifier: QuestionnaireNotifier
  limiter: RateLimiter
  log: ErrorLog
}

export const assignmentLimit: RateLimit = { limit: 30, windowSeconds: 60 * 60 }

const fallbackLocale: Locale = 'pt-BR'

function localeOf(link: PatientLink): Locale {
  return isLocale(link.locale) ? link.locale : fallbackLocale
}

export function createProfessionalQuestionnaireService({
  questionnaires,
  professionals,
  notifier,
  limiter,
  log,
}: ProfessionalQuestionnaireDependencies): ProfessionalQuestionnaireService {
  async function linkOf(user: AuthenticatedUser, patientId: string): Promise<PatientLink> {
    const link = await questionnaires.activeLink(user.id, patientId)
    if (link === undefined) {
      throw new NotFoundError('No active link with this patient')
    }
    return link
  }

  async function kindOf(user: AuthenticatedUser): Promise<ProfessionalKind> {
    const professional = await professionals.find(user.id)
    if (professional === undefined) {
      throw new ForbiddenError('Only verified professionals can release questionnaires')
    }
    return professional.kind
  }

  function ensureAllowed(variant: QuestionnaireVariant, kind: ProfessionalKind, locale: Locale) {
    const reason = unavailableReasonOf(variant, kind, locale)
    if (reason === 'satepsi_not_evaluated') {
      throw new AppError(
        403,
        'QUESTIONNAIRE_NOT_ALLOWED',
        'SATEPSI lists this instrument as not evaluated, so psychologists cannot release it',
      )
    }
    if (reason === 'no_official_text') {
      throw new AppError(
        422,
        'QUESTIONNAIRE_LANGUAGE_UNAVAILABLE',
        'There is no official text of this instrument in the language of the patient',
      )
    }
  }

  async function release(assignmentId: string): Promise<void> {
    try {
      await notifier.released(assignmentId)
    } catch (error) {
      log.error({ err: error }, 'The patient was not told about the questionnaire')
    }
  }

  return {
    async catalog(user, patientId) {
      const [link, kind] = await Promise.all([linkOf(user, patientId), kindOf(user)])
      const locale = localeOf(link)
      return {
        patientLocale: locale,
        complementarySource: isComplementarySource(kind),
        areas: questionnaireAreas.map((area) => ({
          area,
          options: catalogOfArea(area).map((entry) => ({
            variant: entry.variant,
            instrument: entry.instrument,
            name: entry.name,
            itemCount: entry.itemCount,
            minutes: entry.minutes,
            uses: [...entry.uses],
            primary: entry.primary,
            safetyItem: questionnaireForms[entry.variant].safetyItem !== null,
            satepsi: { status: entry.satepsi, checkedOn: satepsiCheckedOn },
            unavailableReason: unavailableReasonOf(entry.variant, kind, locale),
          })),
        })),
      }
    },
    async create(user, patientId, { variant, note, repeatEveryDays }) {
      if (!(await limiter.consume(`questionnaire-assignments:${user.id}`, assignmentLimit))) {
        throw new TooManyRequestsError(
          'QUESTIONNAIRE_LIMIT',
          'Too many questionnaires released in a short time',
        )
      }
      const [link, kind] = await Promise.all([linkOf(user, patientId), kindOf(user)])
      ensureAllowed(variant, kind, localeOf(link))
      let created
      try {
        created = await questionnaires.create(user.id, {
          careLinkId: link.careLinkId,
          patientId,
          instrumentId: catalogEntryOf(variant).instrument,
          variant,
          note,
          repeatEveryDays,
        })
      } catch (error) {
        if (error instanceof OpenAssignmentError) {
          throw new AppError(409, 'QUESTIONNAIRE_ALREADY_OPEN', error.message)
        }
        if (error instanceof ReleaseRefusedError) {
          throw new ForbiddenError(error.message)
        }
        throw error
      }
      await release(created.id)
      return toProfessionalAssignment({ assignment: created, response: null, variant })
    },
    async list(user, patientId) {
      await linkOf(user, patientId)
      const records = await questionnaires.list(user.id, patientId)
      return records.flatMap((record) => {
        const known = knownVariant(record)
        return known === null ? [] : [toProfessionalAssignment(known)]
      })
    },
    async detail(user, patientId, assignmentId) {
      const [record, kind] = await Promise.all([
        questionnaires.find(user.id, patientId, assignmentId),
        kindOf(user),
      ])
      const known = record === undefined ? null : knownVariant(record)
      if (known === null) {
        throw new NotFoundError('No questionnaire with this id')
      }
      return {
        assignment: toProfessionalAssignment(known),
        complementarySource: isComplementarySource(kind),
        response: toResponseDetail(known.response),
        trend: toTrend(await questionnaires.trend(user.id, patientId, known.variant)),
      }
    },
    async cancel(user, patientId, assignmentId) {
      if (!(await questionnaires.cancel(user.id, patientId, assignmentId))) {
        throw new NotFoundError('No open questionnaire with this id')
      }
    },
  }
}
