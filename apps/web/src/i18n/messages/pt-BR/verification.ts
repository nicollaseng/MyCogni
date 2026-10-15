export const verification = {
  steps: {
    title: 'Cadastro profissional',
    progress: 'Passo {current} de {total}',
    back: 'Voltar ao cadastro',
    done: 'concluído',
    names: {
      document: 'Comprovante',
      photo: 'Foto do perfil',
      review: 'Em análise',
    },
    hints: {
      photo: 'Opcional. Aparece para seus pacientes.',
      review: 'A equipe MyCogniAI confere tudo antes de liberar os convites.',
    },
  },
  start: {
    title: 'Envie o comprovante do seu registro.',
    lead: 'Conferimos cada profissional antes de liberar os convites. Seu cadastro entra em análise assim que o comprovante chegar.',
  },
  photo: {
    title: 'Adicione uma foto ao seu perfil.',
    lead: 'É opcional. A foto aparece ao lado do seu nome na página dos seus convites e para os pacientes que acompanham com você.',
    received: 'Comprovante recebido. A análise já começou.',
    add: 'Adicionar foto',
    skip: 'Pular por agora',
    continue: 'Continuar',
    saving: 'Salvando…',
    later: 'Você pode trocar ou remover a foto quando quiser, em Configurações.',
    failed: 'Não conseguimos seguir agora. Tente de novo em instantes.',
  },
  review: {
    settings: 'Para trocar a foto ou o comprovante, abra <link>Configurações</link>.',
  },
  proofs: {
    crp: {
      title: 'Carteira do CRP',
      hint: 'Foto ou PDF da carteira de identidade profissional do Conselho Regional de Psicologia, com nome e número legíveis.',
    },
    crm: {
      title: 'Carteira do CRM',
      hint: 'Foto ou PDF da carteira do Conselho Regional de Medicina, com nome e número legíveis.',
    },
    institution: {
      title: 'Comprovante de formação',
      hint: 'Certificado ou declaração da instituição psicanalítica que comprove sua formação ou filiação, com seu nome.',
    },
  },
  upload: {
    choose: 'Escolher arquivo',
    drop: 'ou arraste o arquivo até aqui',
    formats: 'PDF, JPG ou PNG, até 10 MB.',
    replace: 'Trocar',
    remove: 'Remover',
    send: 'Enviar comprovante',
    sending: 'Enviando…',
    sent: 'Comprovante enviado. Vamos conferir em breve.',
    consent:
      'Usamos este documento só para verificar seu registro. Apenas a equipe MyCogniAI tem acesso, e ele é apagado quando você pedir.',
    errors: {
      type: 'Use um arquivo PDF, JPG ou PNG.',
      size: 'O arquivo precisa ter até 10 MB.',
      failed: 'Não conseguimos enviar o comprovante agora. Tente de novo em instantes.',
    },
  },
  document: {
    title: 'Comprovante de registro',
    sentAt: 'Enviado em {date}',
    status: {
      pending: 'Em análise',
      verified: 'Aprovado',
      rejected: 'Recusado',
      missing: 'Não enviado',
    },
    resend: 'Enviar um novo comprovante',
    locked:
      'Seu registro já foi verificado. Para trocar o comprovante, escreva para <link>{email}</link>.',
  },
}

export type VerificationMessages = typeof verification
