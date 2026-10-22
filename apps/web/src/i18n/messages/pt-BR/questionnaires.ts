import { labelsFor } from '@mycogni/domain'

const labels = labelsFor('pt-BR')

export const questionnaires = {
  meta: { title: 'Questionário' },
  label: 'Questionário',
  areas: {
    depression: 'Sobre ânimo',
    anxiety: 'Sobre ansiedade',
    trauma: 'Sobre lembranças de um evento difícil',
    attention: 'Sobre atenção e agitação',
    distress: 'Sobre como você tem se sentido',
  },
  names: {
    depression: 'Desânimo',
    anxiety: 'Ansiedade',
    trauma: 'Lembranças de um evento difícil',
    attention: 'Desatenção e agitação',
    distress: 'Mal-estar emocional',
  },
  levels: labels.plainLevels,
  size: '{count, plural, =0 {# perguntas} one {# pergunta} other {# perguntas}} · cerca de {minutes} min',
  card: {
    title: 'Seu profissional liberou um questionário',
    open: 'Responder',
    resume: 'Continuar',
    more: '{count, plural, =0 {Não há mais questionários} one {Há mais # questionário} other {Há mais # questionários}} para responder.',
    all: 'Ver todos',
  },
  list: {
    title: 'Questionários',
    open: 'Para responder',
    answered: 'Respondidos',
    empty: 'Quando seu profissional liberar um questionário, ele aparece aqui.',
    noneAnswered: 'Você ainda não respondeu nenhum questionário.',
    from: 'De {name}',
    progress: '{answered} de {total} respondidas',
    answeredOn: 'Respondido em {date}',
    careful: 'Algumas respostas pedem cuidado',
    start: 'Responder',
    resume: 'Continuar',
  },
  intro: {
    message: 'Mensagem de {name}',
    notice:
      'Seu profissional verá suas respostas completas. Você verá um resumo simples. Isto não é um diagnóstico.',
    pause: 'Você pode parar quando quiser e continuar depois.',
    start: 'Começar',
    later: 'Agora não',
  },
  question: {
    back: 'Voltar',
    pause: 'Pausar',
    progress: 'Pergunta {current} de {total}',
    saving: 'Salvando…',
    retry: 'Tentar de novo',
  },
  summary: {
    title: 'Obrigado por responder.',
    talk: 'Converse com seu profissional sobre isso.',
    notDiagnosis: 'É uma triagem, não um diagnóstico.',
    safety:
      'Algumas respostas pedem cuidado. Seu profissional vai ver o que você respondeu, mas não acompanha o app o tempo todo.',
    lines: 'Se pensar em se ferir, ligue:',
    today: 'Voltar para Hoje',
    list: 'Ver questionários',
    sentences: {
      depression: {
        low: 'Nas últimas 2 semanas, suas respostas mostram poucos sinais de desânimo. Isso não exclui que algo precise de atenção.',
        mild: 'Nas últimas 2 semanas, suas respostas mostram sinais leves de desânimo.',
        moderate: 'Nas últimas 2 semanas, suas respostas mostram sinais moderados de desânimo.',
        high: 'Nas últimas 2 semanas, suas respostas mostram sinais intensos de desânimo.',
      },
      anxiety: {
        low: 'Nas últimas 2 semanas, suas respostas mostram poucos sinais de ansiedade. Isso não exclui que algo precise de atenção.',
        mild: 'Nas últimas 2 semanas, suas respostas mostram sinais leves de ansiedade.',
        moderate: 'Nas últimas 2 semanas, suas respostas mostram sinais moderados de ansiedade.',
        high: 'Nas últimas 2 semanas, suas respostas mostram sinais intensos de ansiedade.',
      },
      trauma: {
        low: 'No último mês, suas respostas mostram pouco incômodo com lembranças de um evento difícil. Isso não exclui que algo precise de atenção.',
        mild: 'No último mês, suas respostas mostram um incômodo leve com lembranças de um evento difícil.',
        moderate:
          'No último mês, suas respostas mostram um incômodo moderado com lembranças de um evento difícil.',
        high: 'No último mês, suas respostas mostram um incômodo intenso com lembranças de um evento difícil.',
      },
      attention: {
        low: 'Nos últimos 6 meses, suas respostas mostram poucos sinais de desatenção e agitação. Isso não exclui que algo precise de atenção.',
        mild: 'Nos últimos 6 meses, suas respostas mostram alguns sinais de desatenção e agitação.',
        moderate:
          'Nos últimos 6 meses, suas respostas mostram sinais frequentes de desatenção e agitação.',
        high: 'Nos últimos 6 meses, suas respostas mostram sinais muito frequentes de desatenção e agitação.',
      },
      distress: {
        low: 'Nos últimos 30 dias, suas respostas mostram pouco mal-estar emocional. Isso não exclui que algo precise de atenção.',
        mild: 'Nos últimos 30 dias, suas respostas mostram um mal-estar emocional leve.',
        moderate: 'Nos últimos 30 dias, suas respostas mostram um mal-estar emocional moderado.',
        high: 'Nos últimos 30 dias, suas respostas mostram um mal-estar emocional intenso.',
      },
    },
  },
  support: {
    continue: 'Ver o resumo',
  },
  closed: {
    title: 'Este questionário não está mais disponível.',
    body: 'Seu profissional pode liberar outro quando fizer sentido.',
    back: 'Voltar',
  },
  errors: {
    save: 'Não conseguimos salvar agora. Tente de novo em instantes.',
    closed: 'Este questionário não está mais disponível.',
    language:
      'Este questionário não tem versão oficial no idioma do app. Troque o idioma em Perfil ou fale com seu profissional.',
  },
}

export type QuestionnairesMessages = typeof questionnaires
