import type {
  AssistantConversation,
  AssistantConversationSummary,
  AssistantExchange,
  AssistantMessage,
  AssistantOverview,
  SendPersonalAssistantMessageInput,
} from '@mycogni/contracts'
import {
  assistantLimits,
  assistantNotice,
  consentVersion,
  conversationRisk,
  dayKey,
  filterReply,
  mergeRisk,
  repeatsPassage,
  riskForMode,
  validActions,
  type AssistantAction,
  type AssistantRole,
  type Locale,
  type NoticeKind,
  type RiskLevel,
} from '@mycogni/domain'
import type { AssistantModel, AssistantTurn } from '../../ai/assistant-model.ts'
import { assistantNotes, assistantPrompt } from '../../ai/assistant-prompts.ts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { ForbiddenError, NotFoundError, TooManyRequestsError } from '../../shared/errors.ts'
import type { RateLimiter } from '../../shared/rate-limiter.ts'
import type { AssessmentRepository } from '../assessments/assessment.repository.ts'
import type { CareLinkRepository } from '../care-links/care-link.repository.ts'
import type { ConsentRepository } from '../consents/consent.repository.ts'
import type { JournalRepository } from '../journal/journal.repository.ts'
import type { ProfessionalRepository } from '../professionals/professional.repository.ts'
import { assistantToolNames, type AssistantToolbox, type ToolAccess } from './assistant-tools.ts'
import type {
  AssistantRepository,
  AssistantScope,
  ConversationRecord,
  MessageRecord,
} from './assistant.repository.ts'

export interface AssistantLog {
  info(details: object, message: string): void
  error(details: object, message: string): void
}

export interface AssistantService {
  overview(user: AuthenticatedUser, scope: AssistantScope): Promise<AssistantOverview>
  conversation(user: AuthenticatedUser, id: string): Promise<AssistantConversation>
  send(
    user: AuthenticatedUser,
    scope: AssistantScope,
    input: SendPersonalAssistantMessageInput,
  ): Promise<AssistantExchange>
  remove(user: AuthenticatedUser, id: string): Promise<void>
}

export interface AssistantDependencies {
  conversations: AssistantRepository
  toolbox: AssistantToolbox
  consents: ConsentRepository
  careLinks: CareLinkRepository
  professionals: ProfessionalRepository
  assessments: AssessmentRepository
  journal: Pick<JournalRepository, 'find'>
  model: AssistantModel | null
  limiter: RateLimiter
  log: AssistantLog
  now: () => Date
}

type OutcomeKind = 'answer' | 'crisis' | 'refusal' | 'withheld' | 'unavailable'

interface Outcome {
  kind: OutcomeKind
  role: AssistantRole
  text: string
  risk: RiskLevel
  tools: number
  actions: AssistantAction[]
}

interface Question {
  user: AuthenticatedUser
  scope: AssistantScope
  access: ToolAccess
  history: readonly MessageRecord[]
  text: string
  locale: Locale
  watch: boolean
  pageId: string | null
}

const dayInMilliseconds = 24 * 60 * 60 * 1000

const reopenedAfterMilliseconds = 6 * 60 * 60 * 1000

const conversationMessages = 200

function toMessage(record: MessageRecord): AssistantMessage {
  return {
    id: record.id,
    role: record.role,
    text: record.content,
    risk: record.risk,
    createdAt: record.createdAt.toISOString(),
  }
}

function toSummary(record: ConversationRecord): AssistantConversationSummary {
  return {
    id: record.id,
    mode: record.mode,
    risk: record.risk,
    preview: record.preview,
    entryId: record.journalEntryId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function toTurn(record: MessageRecord): AssistantTurn {
  return { role: record.role === 'user' ? 'user' : 'assistant', text: record.content }
}

function reopenedAfterGap(history: readonly MessageRecord[], at: Date): boolean {
  const last = history.at(-1)
  return last !== undefined && at.getTime() - last.createdAt.getTime() >= reopenedAfterMilliseconds
}

function ownerOf(user: AuthenticatedUser, scope: AssistantScope): string {
  return scope.mode === 'personal' ? user.id : scope.patientId
}

function belongsTo(record: ConversationRecord, scope: AssistantScope): boolean {
  return scope.mode === 'personal'
    ? record.mode === 'personal'
    : record.mode === 'professional' && record.patientId === scope.patientId
}

function errorKind(error: unknown): object {
  if (!(error instanceof Error)) {
    return { error: 'unknown' }
  }
  const status = 'status' in error && typeof error.status === 'number' ? error.status : null
  return { error: error.name, status }
}

export function createAssistantService({
  conversations,
  toolbox,
  consents,
  careLinks,
  professionals,
  assessments,
  journal,
  model,
  limiter,
  log,
  now,
}: AssistantDependencies): AssistantService {
  async function requireScope(user: AuthenticatedUser, scope: AssistantScope): Promise<void> {
    if (scope.mode === 'personal') {
      return
    }
    const professional = await professionals.find(user.id)
    if (professional?.status !== 'verified') {
      throw new ForbiddenError('Only verified professionals can ask about patients')
    }
    const linked = (await careLinks.listPatients(user.id)).some(
      (link) => link.patientId === scope.patientId,
    )
    if (!linked) {
      throw new NotFoundError('Patient not found')
    }
  }

  async function accessOf(user: AuthenticatedUser, scope: AssistantScope): Promise<ToolAccess> {
    const granted = await consents.findGranted(ownerOf(user, scope), consentVersion)
    const kinds = granted.map((consent) => consent.kind)
    if (scope.mode === 'professional') {
      const records = kinds.includes('ai_processing')
      return { records, journal: records }
    }
    const records = kinds.includes('assistant_data')
    return { records, journal: records && kinds.includes('assistant_journal') }
  }

  async function screeningRisk(
    user: AuthenticatedUser,
    scope: AssistantScope,
    access: ToolAccess,
  ): Promise<boolean> {
    if (!access.records) {
      return false
    }
    const since = now().getTime() - assistantLimits.screeningRiskDays * dayInMilliseconds
    const records = await assessments.list(user.id, ownerOf(user, scope))
    return records.some(
      (record) =>
        record.instrument === 'phq9' && record.hasRiskFlag && record.completedAt.getTime() >= since,
    )
  }

  async function existingConversation(
    user: AuthenticatedUser,
    scope: AssistantScope,
    id: string | null,
  ): Promise<ConversationRecord | null> {
    if (id === null) {
      return null
    }
    const found = await conversations.find(user.id, id)
    if (found === undefined || !belongsTo(found, scope)) {
      throw new NotFoundError('Conversation not found')
    }
    return found
  }

  async function pageOf(
    user: AuthenticatedUser,
    scope: AssistantScope,
    existing: ConversationRecord | null,
    entryId: string | undefined,
  ): Promise<string | null> {
    if (existing !== null) {
      return existing.journalEntryId
    }
    if (scope.mode !== 'personal' || entryId === undefined) {
      return null
    }
    const page = await journal.find(user.id, entryId)
    if (page?.userId !== user.id) {
      throw new NotFoundError('Page not found')
    }
    return entryId
  }

  async function consumeLimits(user: AuthenticatedUser): Promise<void> {
    const hourly = await limiter.consume(`assistant:hour:${user.id}`, {
      limit: assistantLimits.hourlyMessages,
      windowSeconds: 60 * 60,
    })
    const allowed =
      hourly &&
      (await limiter.consume(`assistant:day:${user.id}`, {
        limit: assistantLimits.dailyMessages,
        windowSeconds: 24 * 60 * 60,
      }))
    if (!allowed) {
      throw new TooManyRequestsError(
        'ASSISTANT_RATE_LIMITED',
        'Too many messages to the assistant, try again later',
      )
    }
  }

  function notice(question: Question, kind: NoticeKind, tools: number): Outcome {
    return {
      kind,
      role: 'notice',
      text: assistantNotice(question.locale, question.scope.mode, kind),
      risk: kind === 'crisis' ? 'urgent' : 'none',
      tools,
      actions: [],
    }
  }

  async function ask(question: Question): Promise<Outcome> {
    if (model === null) {
      return notice(question, 'unavailable', 0)
    }
    const { user, scope, access } = question
    const ownerId = ownerOf(user, scope)
    const timeZone = await conversations.timeZoneOf(user.id, ownerId)
    const run = toolbox.runner({
      viewerId: user.id,
      ownerId,
      mode: scope.mode,
      locale: question.locale,
      timeZone,
      records: access.records,
      journal: access.journal,
      pageId: question.pageId,
    })
    const system = assistantPrompt(scope.mode)
    let tools = 0
    try {
      const answer = await model.answer({
        system,
        history: [...question.history.map(toTurn), { role: 'user', text: question.text }],
        notes: assistantNotes({
          mode: scope.mode,
          locale: question.locale,
          today: dayKey(now(), timeZone),
          timeZone,
          records: access.records,
          journal: access.journal,
          watch: question.watch,
          page: question.pageId !== null,
          reopened: reopenedAfterGap(question.history, now()),
        }),
        tools: toolbox.definitions(access, scope.mode, question.pageId !== null),
        runTool: (call) => {
          tools += 1
          return run(call)
        },
      })
      if (answer.kind === 'refusal') {
        return notice(question, 'refusal', tools)
      }
      if (repeatsPassage(answer.text, system)) {
        return { ...notice(question, 'refusal', tools), kind: 'withheld' }
      }
      const text = filterReply(answer.text, {
        ownEmail: user.email,
        hiddenTerms: assistantToolNames,
        maxLength: assistantLimits.replyLength,
      })
      if (text === '') {
        return notice(question, 'unavailable', tools)
      }
      const actions =
        answer.risk === 'urgent' ? [] : validActions(answer.actions, question.scope.mode)
      return { kind: 'answer', role: 'assistant', text, risk: answer.risk, tools, actions }
    } catch (error) {
      log.error(errorKind(error), 'Assistant model failed')
      return notice(question, 'unavailable', tools)
    }
  }

  return {
    async overview(user, scope) {
      await requireScope(user, scope)
      const [access, list] = await Promise.all([
        accessOf(user, scope),
        conversations.list(user.id, scope, assistantLimits.conversations),
      ])
      return { access, conversations: list.map(toSummary) }
    },
    async conversation(user, id) {
      const found = await conversations.find(user.id, id)
      if (found === undefined) {
        throw new NotFoundError('Conversation not found')
      }
      const messages = await conversations.messages(user.id, id, conversationMessages)
      return { ...toSummary(found), messages: messages.map(toMessage) }
    },
    async send(user, scope, input) {
      const started = Date.now()
      await requireScope(user, scope)
      const existing = await existingConversation(user, scope, input.conversationId)
      const pageId = await pageOf(user, scope, existing, input.entryId)
      const history =
        existing === null
          ? []
          : await conversations.messages(user.id, existing.id, assistantLimits.historyMessages)
      const access = await accessOf(user, scope)
      const detected = conversationRisk({
        message: input.text,
        earlier: history.filter((message) => message.role === 'user').map((m) => m.content),
        screeningRisk: await screeningRisk(user, scope, access),
      })
      const detector = riskForMode(detected.level, scope.mode)
      const question: Question = {
        user,
        scope,
        access,
        history,
        text: input.text,
        locale: input.locale,
        watch: detector !== 'none',
        pageId,
      }
      let outcome: Outcome
      if (detector === 'urgent') {
        outcome = notice(question, 'crisis', 0)
      } else {
        await consumeLimits(user)
        outcome = await ask(question)
      }
      const conversation = existing ?? (await conversations.create(user.id, scope, pageId))
      const risk = mergeRisk(detector, outcome.risk)
      const saved = await conversations.append(
        user.id,
        conversation.id,
        [
          { role: 'user', content: input.text, risk: detector },
          { role: outcome.role, content: outcome.text, risk },
        ],
        risk,
      )
      log.info(
        {
          conversationId: conversation.id,
          mode: scope.mode,
          page: pageId !== null,
          outcome: outcome.kind,
          detector,
          signals: detected.signals,
          risk,
          tools: outcome.tools,
          durationMs: Date.now() - started,
        },
        'Assistant message answered',
      )
      const actions = risk === 'urgent' ? [] : outcome.actions
      const messages = saved.map((record) =>
        record.role === 'assistant' && actions.length > 0
          ? { ...toMessage(record), actions }
          : toMessage(record),
      )
      return { conversationId: conversation.id, messages, risk }
    },
    async remove(user, id) {
      if (!(await conversations.remove(user.id, id))) {
        throw new NotFoundError('Conversation not found')
      }
    },
  }
}
