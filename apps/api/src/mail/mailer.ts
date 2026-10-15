import type { MailConfig } from '../config/env.ts'
import type { ErrorLog } from '../shared/log.ts'

export interface Email {
  to: string
  subject: string
  html: string
  text: string
}

export interface Mailer {
  send(email: Email): Promise<boolean>
}

interface Sender {
  name: string
  address: string
}

function parseSender(from: string): Sender {
  const match = /^(.*)<(.+)>$/.exec(from)
  const name = match?.[1]?.trim() ?? ''
  const address = match?.[2]?.trim() ?? from.trim()
  return { name, address }
}

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Mail provider answered ${String(response.status)}: ${await response.text()}`)
  }
}

function resendMailer(apiKey: string, from: string): Mailer {
  return {
    async send({ to, subject, html, text }) {
      await post(
        'https://api.resend.com/emails',
        { authorization: `Bearer ${apiKey}` },
        { from, to: [to], subject, html, text },
      )
      return true
    },
  }
}

function mailpitMailer(url: string, from: string): Mailer {
  const sender = parseSender(from)
  return {
    async send({ to, subject, html, text }) {
      await post(
        `${url}/api/v1/send`,
        {},
        {
          From: { Email: sender.address, Name: sender.name },
          To: [{ Email: to }],
          Subject: subject,
          HTML: html,
          Text: text,
        },
      )
      return true
    },
  }
}

const silentMailer: Mailer = { send: () => Promise.resolve(false) }

function providerMailer(config: MailConfig): Mailer {
  switch (config.provider) {
    case 'resend':
      return resendMailer(config.apiKey, config.from)
    case 'mailpit':
      return mailpitMailer(config.url, config.from)
    case 'none':
      return silentMailer
  }
}

export function createMailer(config: MailConfig, log: ErrorLog): Mailer {
  const mailer = providerMailer(config)
  return {
    async send(email) {
      try {
        return await mailer.send(email)
      } catch (error) {
        log.error({ err: error }, 'Email was not sent')
        return false
      }
    },
  }
}
