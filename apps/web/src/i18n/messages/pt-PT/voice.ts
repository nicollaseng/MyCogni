import type { VoiceMessages } from '../pt-BR/voice'

export const voice: VoiceMessages = {
  speak: 'Falar',
  cancel: 'Cancelar gravação',
  stop: 'Parar e rever',
  send: 'Enviar',
  recording: 'A gravar',
  transcribing: 'A transcrever…',
  elapsed: 'A gravar · {time}',
  notices: {
    denied: 'Permita o microfone para falar com o Cogni.',
    failed: 'Não foi possível transcrever agora. Tente de novo ou escreva.',
    empty: 'Não foi possível ouvir. Tente de novo, mais perto do microfone.',
    limit: 'Demasiadas mensagens de voz por agora. Escreva ou tente mais tarde.',
  },
}
