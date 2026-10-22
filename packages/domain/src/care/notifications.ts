export const notificationKinds = [
  'invitation',
  'professional',
  'marketing',
  'system',
  'insight',
  'support',
  'reminder',
  'export_ready',
  'export_failed',
  'questionnaire_assigned',
  'questionnaire_completed',
] as const

export type NotificationKind = (typeof notificationKinds)[number]
