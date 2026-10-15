import type { Locale } from '@mycogni/domain'
import type { Email } from '../../mail/mailer.ts'
import { escapeHtml } from '../invitations/invitation-email.ts'

interface AlertEmailCopy {
  subject: string
  someone: string
  title: (name: string) => string
  body: string
  action: string
  frequency: string
  emergency: string
}

const english: AlertEmailCopy = {
  subject: 'Urgent alert on MyCogniAI',
  someone: 'A patient',
  title: (name) => `${name} needs your attention`,
  body: 'An urgent alert was opened in your professional area. For privacy, the details are only shown inside MyCogniAI.',
  action: 'Open alerts',
  frequency: 'You receive at most one email like this per patient every 24 hours.',
  emergency: 'MyCogniAI is not an emergency service.',
}

const copies: Readonly<Record<Locale, AlertEmailCopy>> = {
  'pt-BR': {
    subject: 'Alerta urgente no MyCogniAI',
    someone: 'Um paciente',
    title: (name) => `${name} precisa da sua atenção`,
    body: 'Um alerta urgente foi aberto na sua área profissional. Por privacidade, os detalhes aparecem só dentro do MyCogniAI.',
    action: 'Abrir alertas',
    frequency: 'Você recebe no máximo um email como este por paciente a cada 24 horas.',
    emergency: 'O MyCogniAI não é um serviço de emergência.',
  },
  'pt-PT': {
    subject: 'Alerta urgente no MyCogniAI',
    someone: 'Um paciente',
    title: (name) => `${name} precisa da sua atenção`,
    body: 'Foi aberto um alerta urgente na sua área profissional. Por privacidade, os detalhes aparecem apenas dentro do MyCogniAI.',
    action: 'Abrir alertas',
    frequency: 'Recebe no máximo um email como este por paciente a cada 24 horas.',
    emergency: 'O MyCogniAI não é um serviço de emergência.',
  },
  'en-US': english,
  'en-GB': english,
}

const font = 'font-family: Arial, sans-serif'

const muted = 'font-size: 14px; line-height: 1.6; color: #5b6762'

function paragraph(text: string, style: string): string {
  return `<tr><td style="${font}; ${style}">${escapeHtml(text)}</td></tr>`
}

export function firstNameOf(name: string | null): string | null {
  const [first] = (name ?? '').trim().split(/\s+/)
  return first === undefined || first === '' ? null : first
}

export interface AlertEmailInput {
  to: string
  locale: Locale
  patientName: string | null
  link: string
}

export function alertEmail({ to, locale, patientName, link }: AlertEmailInput): Email {
  const copy = copies[locale]
  const title = copy.title(firstNameOf(patientName) ?? copy.someone)
  const html = `<!doctype html>
<html lang="${locale}">
  <body style="margin: 0; padding: 32px 16px; background: #eef1ea; color: #1e2925">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px">
        <tr><td style="padding-bottom: 32px; font-family: Georgia, serif; font-size: 20px">MyCogniAI</td></tr>
        <tr><td style="padding-bottom: 16px; font-family: Georgia, serif; font-size: 28px; line-height: 1.2">${escapeHtml(title)}</td></tr>
        ${paragraph(copy.body, 'padding-bottom: 28px; font-size: 16px; line-height: 1.6; color: #5b6762')}
        <tr><td style="padding-bottom: 28px">
          <a href="${escapeHtml(link)}" style="${font}; display: inline-block; padding: 14px 24px; border-radius: 6px; background: #22423a; color: #ffffff; font-size: 16px; text-decoration: none">${escapeHtml(copy.action)}</a>
        </td></tr>
        ${paragraph(copy.frequency, `padding-bottom: 8px; ${muted}`)}
        ${paragraph(copy.emergency, muted)}
      </table>
    </td></tr></table>
  </body>
</html>`
  const text = [title, copy.body, `${copy.action}: ${link}`, copy.frequency, copy.emergency].join(
    '\n\n',
  )
  return { to, subject: copy.subject, html, text }
}
