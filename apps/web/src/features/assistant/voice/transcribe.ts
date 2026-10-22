import { z } from 'zod'

export type VoiceNotice = 'denied' | 'failed' | 'empty' | 'limit'

export type TranscribeResult = { ok: true; text: string } | { ok: false; notice: VoiceNotice }

export type Transcribe = (audio: Blob) => Promise<TranscribeResult>

const answerSchema = z.object({ text: z.string() })

const failed: TranscribeResult = { ok: false, notice: 'failed' }

export const transcribeRecording: Transcribe = async (audio) => {
  if (audio.size === 0) {
    return { ok: false, notice: 'empty' }
  }
  try {
    const response = await fetch('/uploads/voice', {
      method: 'POST',
      headers: { 'content-type': audio.type },
      body: audio,
    })
    if (response.status === 429) {
      return { ok: false, notice: 'limit' }
    }
    if (!response.ok) {
      return failed
    }
    const answer = answerSchema.safeParse(await response.json())
    if (!answer.success) {
      return failed
    }
    const text = answer.data.text.trim()
    return text === '' ? { ok: false, notice: 'empty' } : { ok: true, text }
  } catch {
    return failed
  }
}
