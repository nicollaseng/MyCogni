import type { AssistantMessages } from '../pt-BR/assistant'

export const assistant: AssistantMessages = {
  launcher: 'Ask',
  title: 'Ask',
  professionalTitle: 'Ask about {name}',
  professionalAction: 'Ask about this patient',
  close: 'Close',
  disclaimer: 'Not a substitute for a professional.',
  professionalDisclaimer: 'Uses only what this patient shares with you. Makes no diagnosis.',
  help: 'Help now',
  toolbar: {
    new: 'New conversation',
    history: 'Conversations',
    historyEmpty: 'No conversations yet',
    untitled: 'Conversation without text',
    delete: 'Delete',
    deleteQuestion: 'Delete this conversation? This can’t be undone.',
    deleteConfirm: 'Delete conversation',
    deleteCancel: 'Cancel',
  },
  empty: {
    personal:
      'Ask about your records or tell me how you are doing. Answers are short and stay with you.',
    professional:
      'Ask about this patient’s trends, contexts and questionnaires. Answers stay with you.',
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
    assistant: 'MyCogniAI',
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
  support: {
    title: 'You don’t have to go through this without support',
    body: 'Reach out to the people who support you, someone you trust or one of these services, at any time.',
    professionals: 'Who supports you',
    lines: 'Talk to someone now',
  },
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
