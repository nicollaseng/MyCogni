import type { VerificationMessages } from '../pt-BR/verification'

export const verification: VerificationMessages = {
  steps: {
    title: 'Registo profissional',
    progress: 'Passo {current} de {total}',
    back: 'Voltar ao registo',
    done: 'concluído',
    names: {
      document: 'Comprovativo',
      photo: 'Fotografia de perfil',
      review: 'Em análise',
    },
    hints: {
      photo: 'Obrigatória. A equipa compara-a com o documento.',
      review: 'A equipa MyCogniAI confirma tudo antes de disponibilizar os convites.',
    },
  },
  start: {
    title: 'Envie o comprovativo da sua inscrição.',
    lead: 'Confirmamos cada profissional antes de disponibilizar os convites. O registo entra em análise assim que recebermos o comprovativo.',
  },
  photo: {
    title: 'Adicione uma fotografia do seu rosto.',
    lead: 'A fotografia é obrigatória: a nossa equipa compara o seu rosto com o do documento antes de aprovar. Também aparece aos seus pacientes, junto ao seu nome.',
    received: 'Comprovativo recebido. A análise já começou.',
    add: 'Adicionar fotografia',
    tips: 'Use uma fotografia recente, de frente, com boa luz e o rosto todo visível.',
    continue: 'Continuar',
    saving: 'A guardar…',
    later: 'Depois da verificação, o nome e a fotografia só mudam através do suporte.',
    failed: 'Não foi possível continuar agora. Tente novamente dentro de instantes.',
  },
  review: {
    settings: 'Para alterar a fotografia ou o comprovativo, abra as <link>Definições</link>.',
  },
  proofs: {
    crp: {
      title: 'Cédula profissional',
      hint: 'Fotografia ou PDF da cédula profissional da ordem, com nome e número legíveis.',
    },
    crm: {
      title: 'Cédula profissional',
      hint: 'Fotografia ou PDF da cédula profissional da Ordem dos Médicos, com nome e número legíveis.',
    },
    institution: {
      title: 'Comprovativo de formação',
      hint: 'Certificado ou declaração da instituição psicanalítica que comprove a sua formação ou filiação, com o seu nome.',
    },
  },
  upload: {
    choose: 'Escolher ficheiro',
    drop: 'ou arraste o ficheiro para aqui',
    formats: 'PDF, JPG ou PNG, até 10 MB.',
    replace: 'Substituir',
    remove: 'Remover',
    send: 'Enviar comprovativo',
    sending: 'A enviar…',
    sent: 'Comprovativo enviado. Vamos analisá-lo em breve.',
    consent:
      'Usamos este documento apenas para verificar a sua inscrição. Só a equipa MyCogniAI tem acesso, e é eliminado quando o pedir.',
    errors: {
      type: 'Use um ficheiro PDF, JPG ou PNG.',
      size: 'O ficheiro tem de ter até 10 MB.',
      failed: 'Não foi possível enviar o comprovativo agora. Tente novamente dentro de instantes.',
    },
  },
  document: {
    title: 'Comprovativo de inscrição',
    sentAt: 'Enviado a {date}',
    status: {
      pending: 'Em análise',
      verified: 'Aprovado',
      rejected: 'Recusado',
      missing: 'Não enviado',
    },
    resend: 'Enviar um novo comprovativo',
    locked:
      'A sua inscrição já foi verificada. Para substituir o comprovativo, escreva para <link>{email}</link>.',
  },
}
