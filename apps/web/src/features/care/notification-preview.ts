import type { NotificationList } from '@mycogni/contracts'

const previewSize = 8

export function previewOf({ items, unread }: NotificationList): NotificationList {
  return { items: items.slice(0, previewSize), unread }
}
