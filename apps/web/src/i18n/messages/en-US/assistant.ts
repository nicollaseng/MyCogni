import type { AssistantMessages } from '../pt-BR/assistant'

export const assistant: AssistantMessages = {
  launcher: 'Chat',
  launcherLabel: 'Chat with Cogni',
  title: 'Cogni',
  intro:
    'Hi, I’m Cogni, your virtual partner. I can look at your records with you or just hear how your day went.',
  professionalAction: 'Ask about this patient',
  professionalContext: 'About {name}',
  close: 'Close',
  disclaimer: {
    mistakes: 'AI can make mistakes',
    personal: 'MyCogniAI is not a substitute for professional health advice.',
    professional: 'MyCogniAI does not replace your clinical judgment.',
  },
  header: {
    history: 'Conversations',
    new: 'New conversation',
  },
  history: {
    title: 'Conversations',
    back: 'Back',
    empty: 'Your conversations show up here.',
    untitled: 'Conversation without text',
    more: 'More options for {title}',
    delete: 'Delete',
    deleteTitle: 'Delete this conversation?',
    deleteBody: '“{title}” leaves your history. This can’t be undone.',
    deleteConfirm: 'Delete',
    deleteCancel: 'Cancel',
    groups: {
      today: 'Today',
      yesterday: 'Yesterday',
      week: 'This week',
      older: 'Older',
    },
  },
  empty: {
    personal:
      'Ask about your records or tell me how you are doing. Answers are short and stay with you.',
    professional:
      'Ask about this patient’s trends, contexts and questionnaires. Answers stay with you.',
  },
  page: {
    context: 'About this page',
    suggestions: 'Suggestions for this page',
    starters: {
      continue: 'Help me continue',
      feeling: 'What does this text say about how I am?',
      summary: 'Summarize this page',
    },
  },
  starters: {
    personal: {
      mood: 'How has my mood been over the last two weeks?',
      helps: 'What seems to help on my good days?',
      sleep: 'I’ve been sleeping badly. What could I try?',
    },
    professional: {
      trend: 'How has the mood changed over the last weeks?',
      contexts: 'Which contexts show up on the lowest days?',
      screenings: 'What changed in the PHQ-9 and the GAD-7?',
    },
  },
  composer: {
    label: 'Message',
    placeholder: 'Write here',
    send: 'Send',
    count: '{count} of {max}',
  },
  roles: {
    user: 'You',
    assistant: 'Cogni',
  },
  actions: {
    label: 'Suggestions from Cogni',
    breathe: 'Breathe for 1 minute',
    checkIn: 'Check in',
    mybook: 'Write in MyBook',
    read: 'Read: {title}',
    track: 'Track: {title}',
  },
  pending: 'Writing the answer…',
  consent: {
    title: 'May I read your records?',
    body: 'With your permission, I read your check-ins, questionnaires, patterns and summaries to answer about you. You can turn this off at any time in Profile and settings.',
    journal: 'Also read MyBook',
    allow: 'Allow',
    later: 'Not now',
    saving: 'Saving…',
  },
  noAccess: 'Without permission to read your records, I answer in general terms.',
  professionalNoAccess:
    'This patient has not allowed AI to be used on their records. Answers are general.',
  professionalSupport: {
    title: 'Signs of risk',
    body: 'Follow your safety protocol. If there is immediate risk, contact emergency services.',
  },
  errors: {
    limit: 'You sent many messages in a short time. Please try again later.',
    failed: 'Couldn’t send just now. Please try again in a moment.',
    load: 'Couldn’t open the conversations just now.',
    delete: 'Couldn’t delete just now. Please try again in a moment.',
    consent: 'Couldn’t save the permission just now.',
  },
}
