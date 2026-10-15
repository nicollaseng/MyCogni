import { describe, expect, it } from '@jest/globals'
import { escapeHtml, invitationEmail } from '../../src/modules/invitations/invitation-email.ts'

describe('invitationEmail', () => {
  it('writes the invitation in the chosen language with the link', () => {
    const email = invitationEmail({
      to: 'ana@exemplo.com',
      locale: 'pt-BR',
      professionalName: 'Dra. Helena Prado',
      link: 'https://mycogni.app/invite/K7M2X9QA',
    })

    expect(email.to).toBe('ana@exemplo.com')
    expect(email.subject).toBe('Dra. Helena Prado convidou você para o MyCogniAI')
    expect(email.html).toContain('<html lang="pt-BR">')
    expect(email.html).toContain('href="https://mycogni.app/invite/K7M2X9QA"')
    expect(email.text).toContain('Ver convite: https://mycogni.app/invite/K7M2X9QA')
  })

  it('never lets the professional name inject markup', () => {
    const email = invitationEmail({
      to: 'ana@exemplo.com',
      locale: 'en-US',
      professionalName: '<script>alert("x")</script>',
      link: 'https://mycogni.app/invite/K7M2X9QA',
    })

    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
  })

  it('escapes every character that matters in HTML', () => {
    expect(escapeHtml(`a & b < c > d " e ' f`)).toBe('a &amp; b &lt; c &gt; d &quot; e &#39; f')
  })
})
