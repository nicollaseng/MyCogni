import type { VoiceMessages } from '../pt-BR/voice'

export const voice: VoiceMessages = {
  speak: 'Speak',
  cancel: 'Cancel recording',
  stop: 'Stop and review',
  send: 'Send',
  recording: 'Recording',
  transcribing: 'Transcribing…',
  elapsed: 'Recording · {time}',
  notices: {
    denied: 'Allow the microphone to talk to Cogni.',
    failed: 'We could not transcribe that right now. Try again or type instead.',
    empty: 'We could not hear anything. Try again, closer to the microphone.',
    limit: 'Too many voice messages for now. Type instead or try again later.',
  },
}
