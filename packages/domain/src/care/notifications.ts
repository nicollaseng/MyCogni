export const notificationKinds = [
  'invitation',
  'professional',
  'marketing',
  'system',
  'insight',
  'support',
  'reminder',
] as const

export type NotificationKind = (typeof notificationKinds)[number]
