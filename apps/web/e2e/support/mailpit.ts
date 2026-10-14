import { z } from 'zod'
import { localSupabase } from './supabase'

const searchSchema = z.object({
  messages: z.array(z.object({ ID: z.string(), Subject: z.string() })),
})
const messageSchema = z.object({ Text: z.string() })

const attempts = 20
const interval = 250

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

export async function latestCode(email: string, subject: RegExp): Promise<string> {
  const { MAILPIT_URL } = localSupabase()
  const query = encodeURIComponent(`to:"${email}"`)
  for (let attempt = 0; attempt < attempts; attempt++) {
    const search = searchSchema.parse(
      await (await fetch(`${MAILPIT_URL}/api/v1/search?query=${query}`)).json(),
    )
    const message = search.messages.find((candidate) => subject.test(candidate.Subject))
    if (message !== undefined) {
      const { Text } = messageSchema.parse(
        await (await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`)).json(),
      )
      const code = /\b(\d{6})\b/.exec(Text)?.[1]
      if (code !== undefined) {
        return code
      }
    }
    await pause(interval)
  }
  throw new Error(`No email matching ${String(subject)} reached ${email}`)
}
