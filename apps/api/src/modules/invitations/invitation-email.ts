import type { Locale } from '@mycogni/domain'
import type { Email } from '../../mail/mailer.ts'

interface InvitationEmailCopy {
  subject: (name: string) => string
  title: (name: string) => string
  body: (name: string) => string
  choice: string
  action: string
  validity: string
  ignore: (name: string) => string
}

const portugueseValidity = 'O convite vale por 72 horas.'

const english: InvitationEmailCopy = {
  subject: (name) => `${name} invited you to MyCogniAI`,
  title: (name) => `${name} would like to follow your check-ins`,
  body: (name) =>
    `${name} invited you to share your mood check-ins and questionnaires on MyCogniAI, to follow how you are doing between sessions.`,
  choice: 'You decide whether to accept, and you can end the link at any time.',
  action: 'View invitation',
  validity: 'The invitation is valid for 72 hours.',
  ignore: (name) => `If you do not know ${name}, you can ignore this email.`,
}

const copies: Readonly<Record<Locale, InvitationEmailCopy>> = {
  'pt-BR': {
    subject: (name) => `${name} convidou você para o MyCogniAI`,
    title: (name) => `${name} quer acompanhar seus registros`,
    body: (name) =>
      `${name} convidou você para compartilhar seus registros de humor e questionários no MyCogniAI, para acompanhar como você está entre as consultas.`,
    choice: 'Você escolhe se aceita e pode desfazer o vínculo quando quiser.',
    action: 'Ver convite',
    validity: portugueseValidity,
    ignore: (name) => `Se você não conhece ${name}, ignore este email.`,
  },
  'pt-PT': {
    subject: (name) => `${name} enviou-lhe um convite para o MyCogniAI`,
    title: (name) => `${name} quer acompanhar os seus registos`,
    body: (name) =>
      `${name} enviou-lhe um convite para partilhar os seus registos de humor e questionários no MyCogniAI, para acompanhar como está entre as consultas.`,
    choice: 'Decide se aceita e pode desfazer a ligação quando quiser.',
    action: 'Ver convite',
    validity: portugueseValidity,
    ignore: (name) => `Se não conhece ${name}, ignore este email.`,
  },
  'en-US': english,
  'en-GB': english,
}

const htmlEntities: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => htmlEntities[character] ?? character)
}

const font = 'font-family: Arial, sans-serif'

function paragraph(text: string, style: string): string {
  return `<tr><td style="${font}; ${style}">${escapeHtml(text)}</td></tr>`
}

export interface InvitationEmailInput {
  to: string
  locale: Locale
  professionalName: string
  link: string
}

export function invitationEmail({
  to,
  locale,
  professionalName,
  link,
}: InvitationEmailInput): Email {
  const copy = copies[locale]
  const name = professionalName
  const html = `<!doctype html>
<html lang="${locale}">
  <body style="margin: 0; padding: 32px 16px; background: #eef1ea; color: #1e2925">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px">
        <tr><td style="padding-bottom: 32px; font-family: Georgia, serif; font-size: 20px">MyCogniAI</td></tr>
        <tr><td style="padding-bottom: 16px; font-family: Georgia, serif; font-size: 28px; line-height: 1.2">${escapeHtml(copy.title(name))}</td></tr>
        ${paragraph(copy.body(name), 'padding-bottom: 12px; font-size: 16px; line-height: 1.6; color: #5b6762')}
        ${paragraph(copy.choice, 'padding-bottom: 28px; font-size: 16px; line-height: 1.6; color: #5b6762')}
        <tr><td style="padding-bottom: 28px">
          <a href="${escapeHtml(link)}" style="${font}; display: inline-block; padding: 14px 28px; border-radius: 999px; background: #22423a; color: #ffffff; font-size: 16px; text-decoration: none">${escapeHtml(copy.action)}</a>
        </td></tr>
        ${paragraph(copy.validity, 'padding-bottom: 8px; font-size: 14px; line-height: 1.6; color: #5b6762')}
        ${paragraph(copy.ignore(name), 'font-size: 14px; line-height: 1.6; color: #5b6762')}
      </table>
    </td></tr></table>
  </body>
</html>`
  const text = [
    copy.title(name),
    copy.body(name),
    copy.choice,
    `${copy.action}: ${link}`,
    copy.validity,
    copy.ignore(name),
  ].join('\n\n')
  return { to, subject: copy.subject(name), html, text }
}
