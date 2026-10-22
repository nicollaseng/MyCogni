import type {
  AnswerQuestionnaireInput,
  PatientQuestionnaires,
  QuestionnaireRun,
  StartQuestionnaireInput,
} from '@mycogni/contracts'
import {
  blankAnswers,
  completeAnswers,
  instrumentVersionOf,
  InvalidQuestionnaireAnswerError,
  questionnaireText,
  scoreQuestionnaire,
  withAnswer,
  type QuestionnaireVariant,
} from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import type { JobScheduler } from '../../jobs/scheduler.ts'
import { AppError, NotFoundError } from '../../shared/errors.ts'
import type { ErrorLog } from '../../shared/log.ts'
import type {
  PatientAssignmentRecord,
  PatientQuestionnaireRepository,
} from './patient-questionnaire.repository.ts'
import type { QuestionnaireNotifier } from './questionnaire-notifier.ts'
import {
  draftOf,
  knownVariant,
  toAnswered,
  toPatientAssignment,
  toRun,
} from './questionnaire.mapper.ts'

export interface PatientQuestionnaireService {
  list(user: AuthenticatedUser): Promise<PatientQuestionnaires>
  run(user: AuthenticatedUser, id: string): Promise<QuestionnaireRun>
  start(
    user: AuthenticatedUser,
    id: string,
    input: StartQuestionnaireInput,
  ): Promise<QuestionnaireRun>
  answer(
    user: AuthenticatedUser,
    id: string,
    input: AnswerQuestionnaireInput,
  ): Promise<QuestionnaireRun>
  complete(user: AuthenticatedUser, id: string): Promise<QuestionnaireRun>
}

export interface PatientQuestionnaireDependencies {
  questionnaires: PatientQuestionnaireRepository
  notifier: QuestionnaireNotifier
  jobs: Pick<JobScheduler, 'questionnaireCompleted'>
  log: ErrorLog
  now: () => Date
}

type KnownRecord = PatientAssignmentRecord & { variant: QuestionnaireVariant }

function closed(): AppError {
  return new AppError(409, 'QUESTIONNAIRE_CLOSED', 'This questionnaire can no longer be answered')
}

export function createPatientQuestionnaireService({
  questionnaires,
  notifier,
  jobs,
  log,
  now,
}: PatientQuestionnaireDependencies): PatientQuestionnaireService {
  async function find(user: AuthenticatedUser, id: string): Promise<KnownRecord> {
    const record = await questionnaires.find(user.id, id)
    const known = record === undefined ? null : knownVariant(record)
    if (known === null || known.assignment.availableFrom > now()) {
      throw new NotFoundError('No questionnaire with this id')
    }
    return known
  }

  async function inProgress(user: AuthenticatedUser, id: string): Promise<KnownRecord> {
    const record = await find(user, id)
    if (record.assignment.status !== 'in_progress' || record.response?.completedAt !== null) {
      throw closed()
    }
    return record
  }

  async function settle(work: () => Promise<unknown>, failure: string): Promise<void> {
    try {
      await work()
    } catch (error) {
      log.error({ err: error }, failure)
    }
  }

  return {
    async list(user) {
      const records = (await questionnaires.list(user.id)).flatMap((record) => {
        const known = knownVariant(record)
        return known === null ? [] : [known]
      })
      const at = now()
      const open = records
        .filter((record) => record.assignment.availableFrom <= at)
        .flatMap((record) => {
          const assignment = toPatientAssignment(record)
          return assignment === null ? [] : [assignment]
        })
        .sort((first, second) => first.availableFrom.localeCompare(second.availableFrom))
      const answered = records
        .flatMap((record) => {
          const done = toAnswered(record)
          return done === null ? [] : [done]
        })
        .sort((first, second) => second.completedAt.localeCompare(first.completedAt))
      return { open, answered }
    },
    async run(user, id) {
      return toRun(await find(user, id))
    },
    async start(user, id, { locale }) {
      const record = await find(user, id)
      if (record.assignment.status === 'in_progress' && record.response !== null) {
        return toRun(record)
      }
      if (record.assignment.status !== 'assigned') {
        throw closed()
      }
      if (questionnaireText(record.variant, locale) === null) {
        throw new AppError(
          422,
          'QUESTIONNAIRE_LANGUAGE_UNAVAILABLE',
          'This questionnaire has no official text in this language',
        )
      }
      await questionnaires.start(user.id, id, {
        instrumentId: record.assignment.instrumentId,
        instrumentVersion: instrumentVersionOf(record.variant),
        locale,
        answers: blankAnswers(record.variant),
      })
      return toRun(await find(user, id))
    },
    async answer(user, id, { item, value }) {
      const record = await inProgress(user, id)
      let answers
      try {
        answers = withAnswer(record.variant, draftOf(record.variant, record.response), item, value)
      } catch (error) {
        if (error instanceof InvalidQuestionnaireAnswerError) {
          throw new AppError(422, 'QUESTIONNAIRE_INVALID_ANSWER', error.message)
        }
        throw error
      }
      const saved = await questionnaires.saveAnswers(user.id, id, answers)
      if (saved === undefined) {
        throw closed()
      }
      return toRun({ ...record, response: saved })
    },
    async complete(user, id) {
      const record = await inProgress(user, id)
      const answers = completeAnswers(record.variant, draftOf(record.variant, record.response))
      if (answers === null) {
        throw new AppError(422, 'QUESTIONNAIRE_INCOMPLETE', 'Every question needs an answer')
      }
      const { score, flags } = scoreQuestionnaire(record.variant, answers)
      const saved = await questionnaires.complete(user.id, id, {
        answers,
        score,
        flags,
        completedAt: now(),
      })
      if (saved === undefined) {
        throw closed()
      }
      await settle(() => notifier.completed(id), 'The professional was not told about the answers')
      if (flags.includes('risk_item')) {
        await jobs.questionnaireCompleted(user.id, saved.id)
      }
      return toRun(await find(user, id))
    },
  }
}
