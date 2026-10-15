import {
  supportTicketLabel,
  type Locale,
  type SupportRequesterRole,
  type SupportSubject,
} from '@mycogni/domain'
import type { Email } from '../../mail/mailer.ts'
import { escapeHtml } from '../invitations/invitation-email.ts'
import type { SupportAttachmentRecord } from './support.repository.ts'
import { supportEmailCopies, supportInboxCopy } from './support-email-copy.ts'

interface Layout {
  locale: string
  title: string
  paragraphs: readonly string[]
  details: readonly (readonly [string, string])[]
  quote: { label: string; text: string } | null
  action: { label: string; link: string }
  footer: readonly string[]
}

const font = 'font-family: Arial, sans-serif'
const muted = 'color: #5b6762'

function row(content: string, style: string): string {
  return `<tr><td style="${font}; ${style}">${content}</td></tr>`
}

function html({ locale, title, paragraphs, details, quote, action, footer }: Layout): string {
  const detailRows = details
    .map(
      ([label, value]) =>
        `<tr><td style="${font}; padding: 6px 16px 6px 0; font-size: 14px; ${muted}; white-space: nowrap; vertical-align: top">${escapeHtml(label)}</td><td style="${font}; padding: 6px 0; font-size: 14px">${escapeHtml(value)}</td></tr>`,
    )
    .join('')
  return `<!doctype html>
<html lang="${locale}">
  <body style="margin: 0; padding: 32px 16px; background: #eef1ea; color: #1e2925">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px">
        <tr><td style="padding-bottom: 32px; font-family: Georgia, serif; font-size: 20px">MyCogniAI</td></tr>
        <tr><td style="padding-bottom: 16px; font-family: Georgia, serif; font-size: 26px; line-height: 1.25">${escapeHtml(title)}</td></tr>
        ${paragraphs.map((text) => row(escapeHtml(text), `padding-bottom: 12px; font-size: 16px; line-height: 1.6; ${muted}`)).join('')}
        <tr><td style="padding: 8px 0 20px"><table role="presentation" cellpadding="0" cellspacing="0">${detailRows}</table></td></tr>
        ${quote === null ? '' : row(escapeHtml(quote.label), `padding-bottom: 6px; font-size: 14px; ${muted}`)}
        ${quote === null ? '' : row(escapeHtml(quote.text), 'padding: 14px 16px; margin-bottom: 20px; border-radius: 6px; background: #e5eae2; font-size: 15px; line-height: 1.6; white-space: pre-wrap')}
        <tr><td style="padding: 24px 0 28px">
          <a href="${escapeHtml(action.link)}" style="${font}; display: inline-block; padding: 12px 22px; border-radius: 6px; background: #23423a; color: #ffffff; font-size: 15px; text-decoration: none">${escapeHtml(action.label)}</a>
        </td></tr>
        ${footer.map((text) => row(escapeHtml(text), `padding-bottom: 8px; font-size: 14px; line-height: 1.6; ${muted}`)).join('')}
      </table>
    </td></tr></table>
  </body>
</html>`
}

function text({ title, paragraphs, details, quote, action, footer }: Layout): string {
  return [
    title,
    ...paragraphs,
    details.map(([label, value]) => `${label}: ${value}`).join('\n'),
    ...(quote === null ? [] : [`${quote.label}:\n${quote.text}`]),
    `${action.label}: ${action.link}`,
    ...footer,
  ].join('\n\n')
}

function email(to: string, subject: string, layout: Layout, replyTo: string | null): Email {
  return {
    to,
    subject,
    html: html(layout),
    text: text(layout),
    ...(replyTo === null ? {} : { replyTo }),
  }
}

export interface TicketEmailInput {
  to: string
  locale: Locale
  number: number
  subject: SupportSubject
  link: string
  replyTo: string
}

export function ticketOpenedEmail({
  to,
  locale,
  number,
  subject,
  link,
  replyTo,
}: TicketEmailInput): Email {
  const copy = supportEmailCopies[locale]
  const title = copy.created.subject(supportTicketLabel(number))
  return email(
    to,
    title,
    {
      locale,
      title,
      paragraphs: [copy.created.body, copy.created.next],
      details: [
        [copy.subjectLabel, copy.subjects[subject]],
        [copy.statusLabel, copy.statuses.pending],
      ],
      quote: null,
      action: { label: copy.action, link },
      footer: [copy.reply],
    },
    replyTo,
  )
}

export interface TicketStatusEmailInput extends TicketEmailInput {
  status: 'in_progress' | 'closed'
  note: string | null
}

export function ticketStatusEmail({
  to,
  locale,
  number,
  subject,
  link,
  replyTo,
  status,
  note,
}: TicketStatusEmailInput): Email {
  const copy = supportEmailCopies[locale]
  const closed = status === 'closed'
  const title = (closed ? copy.closed : copy.inProgress).subject(supportTicketLabel(number))
  return email(
    to,
    title,
    {
      locale,
      title,
      paragraphs: [closed ? copy.closed.body : copy.inProgress.body],
      details: [
        [copy.subjectLabel, copy.subjects[subject]],
        [copy.statusLabel, copy.statuses[status]],
      ],
      quote: closed && note !== null ? { label: copy.closed.note, text: note } : null,
      action: { label: copy.action, link },
      footer: closed ? [copy.closed.again] : [copy.reply],
    },
    replyTo,
  )
}

export interface InboxEmailInput {
  to: string
  number: number
  subject: SupportSubject
  customSubject: string | null
  message: string
  role: SupportRequesterRole
  locale: Locale
  requesterName: string | null
  requesterEmail: string | null
  attachment: SupportAttachmentRecord | null
  link: string
}

function sizeOf(bytes: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'unit',
    unit: bytes >= 1024 * 1024 ? 'megabyte' : 'kilobyte',
    maximumFractionDigits: 1,
  }).format(bytes >= 1024 * 1024 ? bytes / (1024 * 1024) : bytes / 1024)
}

export function supportInboxEmail(input: InboxEmailInput): Email {
  const copy = supportInboxCopy
  const ticket = supportTicketLabel(input.number)
  const topic = supportEmailCopies['pt-BR'].subjects[input.subject]
  const fullTopic = input.customSubject === null ? topic : `${topic}: ${input.customSubject}`
  const attachment =
    input.attachment === null
      ? copy.noAttachment
      : `${input.attachment.fileName} (${input.attachment.contentType}, ${sizeOf(input.attachment.sizeBytes)})`
  return email(
    input.to,
    copy.subject(ticket, fullTopic),
    {
      locale: 'pt-BR',
      title: copy.title(ticket),
      paragraphs: [],
      details: [
        [copy.rows.subject, fullTopic],
        [copy.rows.name, input.requesterName ?? copy.noName],
        [copy.rows.email, input.requesterEmail ?? copy.noEmail],
        [copy.rows.role, copy.roles[input.role]],
        [copy.rows.locale, input.locale],
        [copy.rows.attachment, attachment],
      ],
      quote: { label: copy.message, text: input.message },
      action: { label: copy.action, link: input.link },
      footer: input.requesterEmail === null ? [] : [copy.reply],
    },
    input.requesterEmail,
  )
}
