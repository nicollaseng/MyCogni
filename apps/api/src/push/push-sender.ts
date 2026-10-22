import webpush from 'web-push'
import type { PushConfig } from '../config/env.ts'

export interface PushTarget {
  endpoint: string
  p256dh: string
  auth: string
}

export interface PushMessage {
  title: string
  body: string
  url: string
}

export type PushOutcome = 'sent' | 'gone' | 'failed'

export interface PushSender {
  send(target: PushTarget, message: PushMessage): Promise<PushOutcome>
}

const goneStatuses = new Set([404, 410])

function statusOf(error: unknown): number | null {
  return error instanceof webpush.WebPushError ? error.statusCode : null
}

export function createWebPushSender(config: PushConfig): PushSender {
  const vapidDetails = {
    subject: config.subject,
    publicKey: config.publicKey,
    privateKey: config.privateKey,
  }
  return {
    async send(target, message) {
      try {
        await webpush.sendNotification(
          { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
          JSON.stringify(message),
          { vapidDetails, TTL: 60 * 60, urgency: 'normal' },
        )
        return 'sent'
      } catch (error) {
        const status = statusOf(error)
        return status !== null && goneStatuses.has(status) ? 'gone' : 'failed'
      }
    },
  }
}
