export const notificationKinds = [
  'invitation',
  'professional',
  'marketing',
  'system',
  'insight',
] as const

export type NotificationKind = (typeof notificationKinds)[number]
