import type { Locale } from '@mycogni/domain'
import type { Email } from '../../mail/mailer.ts'
import { escapeHtml } from '../invitations/invitation-email.ts'

interface QuestionnaireEmailCopy {
  subject: string
  body: string
  action: string
  privacy: string
}

const english: QuestionnaireEmailCopy = {
  subject: 'Your professional has shared a questionnaire with you',
  body: 'You can answer it in the app whenever you like.',
  action: 'Open the app',
  privacy: 'For your privacy, the questions only appear inside the app.',
}

const copies: Readonly<Record<Locale, QuestionnaireEmailCopy>> = {
  'pt-BR': {
    subject: 'Seu profissional liberou um questionário para você',
    body: 'Você pode responder no app quando quiser.',
    action: 'Abrir o app',
    privacy: 'Por privacidade, as perguntas só aparecem dentro do app.',
  },
  'pt-PT': {
    subject: 'O seu profissional disponibilizou-lhe um questionário',
    body: 'Pode responder na app quando quiser.',
    action: 'Abrir a app',
    privacy: 'Por privacidade, as perguntas só aparecem dentro da app.',
  },
  'en-US': english,
  'en-GB': english,
}

const font = 'font-family: Arial, sans-serif'

export function questionnaireReleasedEmail(to: string, locale: Locale, link: string): Email {
  const copy = copies[locale]
  const html = `<!doctype html>
<html lang="${locale}">
  <body style="margin: 0; padding: 32px 16px; background: #eef1ea; color: #1e2925">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px">
        <tr><td style="padding-bottom: 32px; font-family: Georgia, serif; font-size: 20px">MyCogniAI</td></tr>
        <tr><td style="padding-bottom: 12px; font-family: Georgia, serif; font-size: 28px; line-height: 1.2">${escapeHtml(copy.subject)}</td></tr>
        <tr><td style="${font}; padding-bottom: 28px; font-size: 16px; line-height: 1.6; color: #5b6762">${escapeHtml(copy.body)}</td></tr>
        <tr><td style="padding-bottom: 36px">
          <a href="${escapeHtml(link)}" style="${font}; display: inline-block; padding: 14px 24px; border-radius: 6px; background: #22423a; color: #ffffff; font-size: 16px; text-decoration: none">${escapeHtml(copy.action)}</a>
        </td></tr>
        <tr><td style="${font}; font-size: 13px; line-height: 1.6; color: #5b6762">${escapeHtml(copy.privacy)}</td></tr>
      </table>
    </td></tr></table>
  </body>
</html>`
  const text = [copy.subject, copy.body, `${copy.action}: ${link}`, copy.privacy].join('\n\n')
  return { to, subject: copy.subject, html, text }
}
