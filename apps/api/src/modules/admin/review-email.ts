import type { Locale, ReviewDecision } from '@mycogni/domain'
import type { Email } from '../../mail/mailer.ts'
import { escapeHtml } from '../invitations/invitation-email.ts'

interface DecisionCopy {
  subject: string
  body: string
  next: readonly string[]
}

interface ReviewEmailCopy {
  verified: DecisionCopy
  rejected: DecisionCopy
  reason: string
  action: string
  help: string
}

const english: ReviewEmailCopy = {
  verified: {
    subject: 'Your registration is verified',
    body: 'We checked your professional registration and your MyCogniAI area is ready.',
    next: [
      'Invite patients by email or with a link.',
      'Follow the check-ins each patient chooses to share with you.',
      'Get an alert when someone needs attention.',
    ],
  },
  rejected: {
    subject: 'Your registration was not approved',
    body: 'Our team reviewed your professional registration and did not approve it.',
    next: [
      'Fix what we pointed out and send a new document from the professional area. Your registration goes back to review as soon as it arrives.',
    ],
  },
  reason: 'Reason',
  action: 'Open the professional area',
  help: 'Questions? Contact support from the professional area.',
}

const copies: Readonly<Record<Locale, ReviewEmailCopy>> = {
  'pt-BR': {
    verified: {
      subject: 'Seu cadastro foi verificado',
      body: 'Conferimos seu registro profissional e sua área no MyCogniAI está liberada.',
      next: [
        'Convide pacientes por email ou por link.',
        'Acompanhe os registros que cada paciente decidir compartilhar com você.',
        'Receba um alerta quando alguém precisar de atenção.',
      ],
    },
    rejected: {
      subject: 'Seu cadastro não foi aprovado',
      body: 'Nossa equipe revisou seu cadastro profissional e não conseguiu aprová-lo.',
      next: [
        'Corrija o que foi apontado e envie um novo comprovante pela área profissional. Seu cadastro volta para análise assim que ele chegar.',
      ],
    },
    reason: 'Motivo',
    action: 'Abrir área profissional',
    help: 'Dúvidas? Fale com o suporte pela área profissional.',
  },
  'pt-PT': {
    verified: {
      subject: 'O seu registo foi verificado',
      body: 'Confirmámos o seu registo profissional e a sua área no MyCogniAI está disponível.',
      next: [
        'Convide pacientes por email ou por link.',
        'Acompanhe os registos que cada paciente decidir partilhar consigo.',
        'Receba um alerta quando alguém precisar de atenção.',
      ],
    },
    rejected: {
      subject: 'O seu registo não foi aprovado',
      body: 'A nossa equipa reviu o seu registo profissional e não o conseguiu aprovar.',
      next: [
        'Corrija o que foi indicado e envie um novo comprovativo na área profissional. O seu registo volta a ser analisado assim que o recebermos.',
      ],
    },
    reason: 'Motivo',
    action: 'Abrir área profissional',
    help: 'Dúvidas? Fale com o suporte na área profissional.',
  },
  'en-US': english,
  'en-GB': english,
}

const font = 'font-family: Arial, sans-serif'
const muted = 'color: #5b6762'

function row(content: string, style: string): string {
  return `<tr><td style="${font}; ${style}">${escapeHtml(content)}</td></tr>`
}

export interface ReviewEmailInput {
  to: string
  locale: Locale
  decision: ReviewDecision
  note: string | null
  link: string
}

export function reviewEmail({ to, locale, decision, note, link }: ReviewEmailInput): Email {
  const copy = copies[locale]
  const { subject, body, next } = copy[decision]
  const reason = decision === 'rejected' && note !== null ? note : null
  const html = `<!doctype html>
<html lang="${locale}">
  <body style="margin: 0; padding: 32px 16px; background: #eef1ea; color: #1e2925">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px">
        <tr><td style="padding-bottom: 32px; font-family: Georgia, serif; font-size: 20px">MyCogniAI</td></tr>
        <tr><td style="padding-bottom: 16px; font-family: Georgia, serif; font-size: 26px; line-height: 1.25">${escapeHtml(subject)}</td></tr>
        ${row(body, `padding-bottom: 16px; font-size: 16px; line-height: 1.6; ${muted}`)}
        ${reason === null ? '' : row(copy.reason, `padding-bottom: 6px; font-size: 14px; ${muted}`)}
        ${reason === null ? '' : row(reason, 'padding: 14px 16px; border-radius: 6px; background: #e5eae2; font-size: 15px; line-height: 1.6; white-space: pre-wrap')}
        ${next.map((line) => row(line, `padding-top: 12px; font-size: 16px; line-height: 1.6; ${muted}`)).join('')}
        <tr><td style="padding: 28px 0">
          <a href="${escapeHtml(link)}" style="${font}; display: inline-block; padding: 12px 22px; border-radius: 6px; background: #23423a; color: #ffffff; font-size: 15px; text-decoration: none">${escapeHtml(copy.action)}</a>
        </td></tr>
        ${row(copy.help, `font-size: 14px; line-height: 1.6; ${muted}`)}
      </table>
    </td></tr></table>
  </body>
</html>`
  const text = [
    subject,
    body,
    ...(reason === null ? [] : [`${copy.reason}:\n${reason}`]),
    ...next,
    `${copy.action}: ${link}`,
    copy.help,
  ].join('\n\n')
  return { to, subject, html, text }
}
