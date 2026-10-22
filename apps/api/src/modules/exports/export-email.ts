import type { Locale } from '@mycogni/domain'
import type { Email } from '../../mail/mailer.ts'
import { escapeHtml } from '../invitations/invitation-email.ts'
import { exportCopies } from './export-copy.ts'

const font = 'font-family: Arial, sans-serif'

export function exportReadyEmail(to: string, locale: Locale, link: string): Email {
  const copy = exportCopies[locale]
  const html = `<!doctype html>
<html lang="${locale}">
  <body style="margin: 0; padding: 32px 16px; background: #eef1ea; color: #1e2925">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px">
        <tr><td style="padding-bottom: 32px; font-family: Georgia, serif; font-size: 20px">MyCogniAI</td></tr>
        <tr><td style="padding-bottom: 12px; font-family: Georgia, serif; font-size: 28px; line-height: 1.2">${escapeHtml(copy.emailTitle)}</td></tr>
        <tr><td style="${font}; padding-bottom: 28px; font-size: 16px; line-height: 1.6; color: #5b6762">${escapeHtml(copy.emailBody)}</td></tr>
        <tr><td style="padding-bottom: 36px">
          <a href="${escapeHtml(link)}" style="${font}; display: inline-block; padding: 14px 24px; border-radius: 6px; background: #22423a; color: #ffffff; font-size: 16px; text-decoration: none">${escapeHtml(copy.emailAction)}</a>
        </td></tr>
        <tr><td style="${font}; font-size: 13px; line-height: 1.6; color: #5b6762">${escapeHtml(copy.emailPrivacy)}</td></tr>
      </table>
    </td></tr></table>
  </body>
</html>`
  const text = [
    copy.emailTitle,
    copy.emailBody,
    `${copy.emailAction}: ${link}`,
    copy.emailPrivacy,
  ].join('\n\n')
  return { to, subject: copy.emailSubject, html, text }
}
