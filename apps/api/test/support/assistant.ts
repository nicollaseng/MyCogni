import type { ProposedAction, RiskLevel } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import type {
  AssistantAnswer,
  AssistantModel,
  AssistantRequest,
  ToolCall,
} from '../../src/ai/assistant-model.ts'
import type { Database } from '../../src/db/client.ts'
import { checkIns, journalEntries } from '../../src/db/schema/index.ts'

export class FakeAssistantModel implements AssistantModel {
  readonly model = 'fake'
  readonly requests: AssistantRequest[] = []
  readonly results: string[] = []
  calls: ToolCall[] = []
  reply = 'Resposta de teste.'
  risk: RiskLevel = 'none'
  actions: ProposedAction[] = []
  outcome: 'answer' | 'refusal' | 'error' = 'answer'

  async answer(request: AssistantRequest): Promise<AssistantAnswer> {
    this.requests.push(request)
    for (const call of this.calls) {
      this.results.push(await request.runTool(call))
    }
    if (this.outcome === 'error') {
      throw new Error(`upstream failed for ${request.history.at(-1)?.text ?? ''}`)
    }
    return this.outcome === 'refusal'
      ? { kind: 'refusal' }
      : { kind: 'answer', text: this.reply, risk: this.risk, actions: this.actions }
  }

  reset(): void {
    this.requests.length = 0
    this.results.length = 0
    this.calls = []
    this.reply = 'Resposta de teste.'
    this.risk = 'none'
    this.actions = []
    this.outcome = 'answer'
  }

  lastRequest(): AssistantRequest {
    const request = this.requests.at(-1)
    if (request === undefined) {
      throw new Error('The model was not called')
    }
    return request
  }
}

export async function seedRecords(db: Database, userId: string, marker: string): Promise<void> {
  await db.insert(checkIns).values(
    [0, 1, 2, 3].map((daysAgo) => ({
      userId,
      moodLevel: 4,
      emotions: ['calm'],
      contexts: ['exercise'],
      note: `nota de ${marker}`,
      recordedAt: sql`now() - make_interval(days => ${daysAgo}, hours => 1)`,
    })),
  )
  await db
    .insert(journalEntries)
    .values({ userId, title: `Diário de ${marker}`, plainText: `página de ${marker}` })
}
