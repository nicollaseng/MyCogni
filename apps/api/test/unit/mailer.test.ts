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

  it('asks both providers to send replies to the given address', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }))
    const reply = { ...email, replyTo: 'suporte@exemplo.com' }

    await createMailer({ provider: 'resend', apiKey: 're_test', from: 'a@b.co' }, logger()).send(
      reply,
    )
    await createMailer({ provider: 'mailpit', url: 'http://m', from: 'a@b.co' }, logger()).send(
      reply,
    )

    const bodies = fetchMock.mock.calls.map(([, init]): unknown =>
      JSON.parse(typeof init?.body === 'string' ? init.body : '{}'),
    )
    expect(bodies[0]).toEqual(expect.objectContaining({ reply_to: 'suporte@exemplo.com' }))
    expect(bodies[1]).toEqual(
      expect.objectContaining({ ReplyTo: [{ Email: 'suporte@exemplo.com' }] }),
    )
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
