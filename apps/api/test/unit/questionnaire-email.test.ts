import { describe, expect, it } from '@jest/globals'
import { locales } from '@mycogni/domain'
import { questionnaireReleasedEmail } from '../../src/modules/questionnaires/questionnaire-email.ts'

const link = 'https://mycogni.app/questionnaires/0b4e1f6e-6f4e-4d38-9b1a-1f3e2d6c5a90'

describe('questionnaireReleasedEmail', () => {
  it('says only that the professional released a questionnaire', () => {
    const email = questionnaireReleasedEmail('ana@exemplo.com', 'pt-BR', link)

    expect(email.subject).toBe('Seu profissional liberou um questionário para você')
    expect(email.html).toContain(`href="${link}"`)
    expect(email.text).toContain(`Abrir o app: ${link}`)
  })

  it.each(locales)('never names an instrument or a condition in %s', (locale) => {
    const email = questionnaireReleasedEmail('ana@exemplo.com', locale, link)
    const words = /PHQ|GAD|PCL|ASRS|K10|K6|depress|ansied|anxi|trauma|TEPT|PTSD|TDAH|ADHD/i

    expect(email.subject).not.toMatch(words)
    expect(email.html).not.toMatch(words)
    expect(email.text).not.toMatch(words)
    expect(email.html).toContain(`<html lang="${locale}">`)
  })
})
