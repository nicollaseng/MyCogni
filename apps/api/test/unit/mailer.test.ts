import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { createMailer, type Email } from '../../src/mail/mailer.ts'

const email: Email = { to: 'ana@exemplo.com', subject: 'Olá', html: '<p>Olá</p>', text: 'Olá' }

function logger() {
  return { error: jest.fn() }
}

describe('createMailer', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sends through Resend with the key and the sender', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"id":"1"}', { status: 200 }))
    const mailer = createMailer(
      { provider: 'resend', apiKey: 're_test', from: 'MyCogniAI <a@b.co>' },
      logger(),
    )

    expect(await mailer.send(email)).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer re_test' },
      body: JSON.stringify({
        from: 'MyCogniAI <a@b.co>',
        to: ['ana@exemplo.com'],
        subject: 'Olá',
        html: '<p>Olá</p>',
        text: 'Olá',
      }),
    })
  })

  it('reports a failed delivery without throwing', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('quota', { status: 429 }))
    const log = logger()
    const mailer = createMailer({ provider: 'mailpit', url: 'http://m', from: 'a@b.co' }, log)

    expect(await mailer.send(email)).toBe(false)
    expect(log.error).toHaveBeenCalledTimes(1)
  })

  it('sends nothing when no provider is configured', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch')

    expect(await createMailer({ provider: 'none' }, logger()).send(email)).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
