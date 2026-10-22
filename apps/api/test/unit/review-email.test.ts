import { describe, expect, it } from '@jest/globals'
import { reviewEmail } from '../../src/modules/admin/review-email.ts'

const base = { to: 'marta@exemplo.com', link: 'https://app.mycogniapp.com/pro' }

describe('review emails', () => {
  it('tells a verified professional what they can do now', () => {
    const email = reviewEmail({ ...base, locale: 'pt-BR', decision: 'verified', note: null })

    expect(email.subject).toBe('Seu cadastro foi verificado')
    expect(email.text).toContain('Convide pacientes por email ou por link.')
    expect(email.text).toContain('Abrir área profissional: https://app.mycogniapp.com/pro')
    expect(email.html).toContain('href="https://app.mycogniapp.com/pro"')
    expect(email.text).not.toContain('Motivo')
  })

  it('gives the reason of a rejection, escaped in the HTML', () => {
    const email = reviewEmail({
      ...base,
      locale: 'pt-PT',
      decision: 'rejected',
      note: 'Documento <ilegível> & sem número',
    })

    expect(email.subject).toBe('O seu registo não foi aprovado')
    expect(email.text).toContain('Motivo:\nDocumento <ilegível> & sem número')
    expect(email.html).toContain('Documento &lt;ilegível&gt; &amp; sem número')
    expect(email.html).not.toContain('<ilegível>')
  })

  it('writes in English for English locales', () => {
    expect(
      reviewEmail({ ...base, locale: 'en-GB', decision: 'verified', note: null }).subject,
    ).toBe('Your registration is verified')
    expect(
      reviewEmail({ ...base, locale: 'en-US', decision: 'rejected', note: 'Blurry card.' }).text,
    ).toContain('Reason:\nBlurry card.')
  })
})
