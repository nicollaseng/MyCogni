export const notificationKinds = ['invitation', 'professional', 'marketing', 'system'] as const

export type NotificationKind = (typeof notificationKinds)[number]
