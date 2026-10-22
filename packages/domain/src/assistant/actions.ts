import { isArticleId, isTrackId, type ArticleId, type TrackId } from '../zen/catalog.ts'
import type { AssistantMode } from './assistant.ts'

export const assistantActionTypes = ['breathe', 'article', 'track', 'check_in', 'mybook'] as const

export type AssistantActionType = (typeof assistantActionTypes)[number]

export type AssistantAction =
  | { type: 'breathe' }
  | { type: 'article'; id: ArticleId }
  | { type: 'track'; id: TrackId }
  | { type: 'check_in' }
  | { type: 'mybook' }

export interface ProposedAction {
  type: string
  id?: string | null
}

export const maxAssistantActions = 2

function actionOf({ type, id }: ProposedAction): AssistantAction | null {
  if (type === 'breathe' || type === 'check_in' || type === 'mybook') {
    return { type }
  }
  if (type === 'article' && isArticleId(id)) {
    return { type, id }
  }
  if (type === 'track' && isTrackId(id)) {
    return { type, id }
  }
  return null
}

function keyOf(action: AssistantAction): string {
  return 'id' in action ? `${action.type}:${action.id}` : action.type
}

export function validActions(
  proposed: readonly ProposedAction[],
  mode: AssistantMode,
): AssistantAction[] {
  if (mode !== 'personal') {
    return []
  }
  const actions: AssistantAction[] = []
  for (const item of proposed) {
    const action = actionOf(item)
    if (action !== null && !actions.some((kept) => keyOf(kept) === keyOf(action))) {
      actions.push(action)
    }
  }
  return actions.slice(0, maxAssistantActions)
}
