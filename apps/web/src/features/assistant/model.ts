import type {
  AssistantConversation,
  AssistantExchange,
  AssistantMessage,
  AssistantOverview,
} from '@mycogni/contracts'
import type { AssistantMode, ProfessionalKind } from '@mycogni/domain'
import type { ActionResult } from '@/shared/lib/actions/result'
import type { AssistantTarget } from '@/shared/lib/api/assistant'

export type { AssistantTarget }

export const assistantPaths: readonly string[] = ['/entries', '/mybook', '/patterns']

export function showsAssistant(pathname: string): boolean {
  return assistantPaths.includes(pathname)
}

export interface SupportContact {
  name: string
  kind: ProfessionalKind
}

export interface AssistantState {
  overview: AssistantOverview
  contacts: SupportContact[]
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

export function needsSupport(message: AssistantMessage, mode: AssistantMode): boolean {
  if (message.role === 'user') {
    return false
  }
  return message.risk !== 'none' || (mode === 'personal' && message.role === 'notice')
}

export function paragraphsOf(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '')
}
