import {
  allowAssistant,
  askAssistant,
  openAssistant,
  openConversation,
  removeConversation,
} from './actions'
import type { AssistantActions } from './model'

export const assistantActions: AssistantActions = {
  open: openAssistant,
  load: openConversation,
  send: askAssistant,
  remove: removeConversation,
  allow: allowAssistant,
}
