import { describe, expect, it } from '@jest/globals'
import {
  supportInboxEmail,
  ticketOpenedEmail,
  ticketStatusEmail,
} from '../../src/modules/support/support-email.ts'

const ticket = {
  to: 'ana@exemplo.com',
  number: 1042,
  subject: 'privacy' as const,
  link: 'https://app.mycogniapp.com/support/1',
  replyTo: 'support@mycogniapp.com',
}

describe('support emails', () => {
  it('escapes what the person wrote and lets the team reply to the person', () => {
    const email = supportInboxEmail({
      to: 'support@mycogniapp.com',
      number: 1042,
      subject: 'other',
      customSubject: 'Dados <b>antigos</b>',
      message: '<script>alert(1)</script>\nSegunda linha',
      role: 'professional',
      locale: 'pt-PT',
      requesterName: 'Ana & Rui',
      requesterEmail: 'ana@exemplo.com',
      attachment: { fileName: 'exame.pdf', contentType: 'application/pdf', sizeBytes: 1_572_864 },
      link: 'https://app.mycogniapp.com/admin/support/1',
    })

    expect(email.subject).toBe('Chamado #1042 · Outro assunto: Dados <b>antigos</b>')
    expect(email.replyTo).toBe('ana@exemplo.com')
    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(email.html).toContain('Ana &amp; Rui')
    expect(email.text).toContain('Anexo: exame.pdf (application/pdf, 1,5 MB)')
    expect(email.text).toContain('Perfil: Profissional')
  })

  it('leaves out the reply line when the requester has no email', () => {
    const email = supportInboxEmail({
      to: 'support@mycogniapp.com',
      number: 7,
      subject: 'technical',
      customSubject: null,
      message: 'O app não abre.',
      role: 'patient',
      locale: 'pt-BR',
      requesterName: null,
      requesterEmail: null,
      attachment: null,
      link: 'https://app.mycogniapp.com/admin/support/7',
    })

    expect(email.replyTo).toBeUndefined()
    expect(email.text).toContain('Nome: Sem nome')
    expect(email.text).not.toContain('Responda a este email')
  })

  it('confirms and follows the ticket in the language of the person', () => {
    expect(ticketOpenedEmail({ ...ticket, locale: 'en-GB' }).subject).toBe(
      'We received your ticket #1042',
    )
    const taken = ticketStatusEmail({
      ...ticket,
      locale: 'pt-PT',
      status: 'in_progress',
      note: null,
    })
    expect(taken.subject).toBe('O seu pedido #1042 está em curso')
    expect(taken.text).toContain('Privacidade e dados (RGPD)')
    const closed = ticketStatusEmail({
      ...ticket,
      locale: 'pt-BR',
      status: 'closed',
      note: 'Removemos os dados.',
    })
    expect(closed.text).toContain('Mensagem da equipe:\nRemovemos os dados.')
    expect(closed.replyTo).toBe('support@mycogniapp.com')
  })
})
