import { describe, expect, it } from '@jest/globals'
import { reminderEmail } from '../../src/modules/reminders/reminder-email.ts'
import { createUnsubscribeTokens } from '../../src/modules/reminders/unsubscribe-token.ts'

const userId = '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10'

describe('unsubscribe tokens', () => {
  const tokens = createUnsubscribeTokens('sb_secret_test')

  it('signs a person and gives them back', () => {
    const token = tokens.sign(userId)

    expect(token.startsWith(`${userId}.`)).toBe(true)
    expect(tokens.verify(token)).toBe(userId)
  })

  it('refuses tampered, foreign or malformed tokens', () => {
    const token = tokens.sign(userId)
    const other = '7a2d5b63-72a8-4d2c-8e4d-2c1e3b5a3b21'

    expect(tokens.verify(`${other}.${token.split('.')[1] ?? ''}`)).toBeNull()
    expect(createUnsubscribeTokens('another_secret').verify(token)).toBeNull()
    expect(tokens.verify(`${token}.extra`)).toBeNull()
    expect(tokens.verify('not-a-token')).toBeNull()
    expect(tokens.verify(`not-a-uuid.${token.split('.')[1] ?? ''}`)).toBeNull()
    expect(tokens.verify(`${userId}.c2hvcnQ`)).toBeNull()
  })
})

describe('reminder email', () => {
  it('invites a short pause with a link to Zen and a way out', () => {
    const email = reminderEmail({
      to: 'marina@exemplo.com',
      locale: 'pt-BR',
      zenLink: 'https://app.exemplo.com/zen',
      offLink: 'https://app.exemplo.com/reminders/email-off?token=a&b',
    })

    expect(email.subject).toBe('Hora da sua pausa')
    expect(email.html).toContain('Que tal alguns minutos para você?')
    expect(email.html).toContain('href="https://app.exemplo.com/zen"')
    expect(email.html).toContain('token=a&amp;b')
    expect(email.text).toContain(
      'Não quero mais lembretes por email: https://app.exemplo.com/reminders/email-off?token=a&b',
    )
    expect(email.headers).toEqual({
      'List-Unsubscribe': '<https://app.exemplo.com/reminders/email-off?token=a&b>',
    })
  })

  it('speaks the person language', () => {
    const email = reminderEmail({
      to: 'mary@example.com',
      locale: 'en-GB',
      zenLink: 'https://app.example.com/zen',
      offLink: 'https://app.example.com/off',
    })

    expect(email.subject).toBe('Time for your pause')
    expect(email.text).toContain('a time to practise')
  })
})
