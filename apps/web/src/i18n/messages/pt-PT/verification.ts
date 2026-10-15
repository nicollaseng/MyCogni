import type { VerificationMessages } from '../pt-BR/verification'

export const verification: VerificationMessages = {
  start: {
    kicker: 'Último passo do registo',
    title: 'Envie o comprovativo da sua inscrição.',
    lead: 'Confirmamos cada profissional antes de disponibilizar os convites. O registo entra em análise assim que recebermos o comprovativo.',
    photo: 'Fotografia de perfil',
    photoHint: 'Opcional. Aparece aos seus pacientes e na página dos seus convites.',
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
    another: 'Escolher outro ficheiro',
    formats: 'PDF, JPG ou PNG, até 10 MB.',
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
