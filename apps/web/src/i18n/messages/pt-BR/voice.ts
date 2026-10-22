export const voice = {
  speak: 'Falar',
  cancel: 'Cancelar gravação',
  stop: 'Parar e revisar',
  send: 'Enviar',
  recording: 'Gravando',
  transcribing: 'Transcrevendo…',
  elapsed: 'Gravando · {time}',
  notices: {
    denied: 'Permita o microfone para falar com o Cogni.',
    failed: 'Não deu para transcrever agora. Tente de novo ou escreva.',
    empty: 'Não deu para ouvir. Tente de novo, mais perto do microfone.',
    limit: 'Muitas mensagens de voz por agora. Escreva ou tente mais tarde.',
  },
}

export type VoiceMessages = typeof voice
