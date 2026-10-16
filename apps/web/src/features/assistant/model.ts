import type {
  AssistantConversation,
  AssistantExchange,
  AssistantMessage,
  AssistantOverview,
} from '@mycogni/contracts'
import type { ActionResult } from '@/shared/lib/actions/result'
import type { LinkedProfessional } from '@/shared/lib/emergency-contacts'
import type { AssistantTarget } from '@/shared/lib/api/assistant'

export type { AssistantTarget }

export const assistantPaths: readonly string[] = ['/entries', '/mybook', '/patterns']

export function showsAssistant(pathname: string): boolean {
  return assistantPaths.includes(pathname)
}

export interface AssistantState {
  overview: AssistantOverview
  contacts: LinkedProfessional[]
}

export interface AssistantActions {
  open: (target: AssistantTarget) => Promise<ActionResult<AssistantState>>
  load: (id: string) => Promise<ActionResult<AssistantConversation>>
  send: (
    target: AssistantTarget,
    conversationId: string | null,
    text: string,
  ) => Promise<ActionResult<AssistantExchange>>
  remove: (id: string) => Promise<ActionResult<null>>
  allow: (journal: boolean) => Promise<ActionResult<null>>
}

export function showsCrisisCard(message: AssistantMessage): boolean {
  return message.role !== 'user' && message.risk === 'urgent'
}

export function paragraphsOf(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '')
}
