import { jest } from '@jest/globals'
import type {
  AssistantConversation,
  AssistantExchange,
  AssistantMessage,
  AssistantOverview,
} from '@mycogni/contracts'
import type { RiskLevel } from '@mycogni/domain'
import type { ActionResult } from '@/shared/lib/actions/result'
import type { AssistantActions, AssistantState, AssistantTarget } from './model'

export const conversationId = '0f6a3c1e-8b2d-4e5f-9a7b-1c2d3e4f5a6b'

export function message(
  role: AssistantMessage['role'],
  text: string,
  risk: RiskLevel = 'none',
): AssistantMessage {
  return {
    id: `${role}-${text.length.toString()}-${risk}`,
    role,
    text,
    risk,
    createdAt: '2026-10-15T13:00:00Z',
  }
}

export function exchange(
  question: string,
  answer: AssistantMessage,
  risk: RiskLevel = answer.risk,
): AssistantExchange {
  return { conversationId, messages: [message('user', question), answer], risk }
}

export function overview(records: boolean, conversations: AssistantOverview['conversations'] = []) {
  return { access: { records, journal: false }, conversations }
}

export function deferred<T>() {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

export function fakeActions(state: AssistantState) {
  return {
    open: jest.fn<(target: AssistantTarget) => Promise<ActionResult<AssistantState>>>(() =>
      Promise.resolve({ ok: true, value: state }),
    ),
    load: jest.fn<(id: string) => Promise<ActionResult<AssistantConversation>>>(() =>
      Promise.resolve({ ok: false, error: 'Não deu para abrir as conversas agora.' }),
    ),
    send: jest.fn<
      (
        target: AssistantTarget,
        conversationId: string | null,
        text: string,
      ) => Promise<ActionResult<AssistantExchange>>
    >(() => Promise.resolve({ ok: false, error: 'Não deu para enviar agora.' })),
    remove: jest.fn<(id: string) => Promise<ActionResult<null>>>(() =>
      Promise.resolve({ ok: true, value: null }),
    ),
    allow: jest.fn<(journal: boolean) => Promise<ActionResult<null>>>(() =>
      Promise.resolve({ ok: true, value: null }),
    ),
  } satisfies AssistantActions
}
