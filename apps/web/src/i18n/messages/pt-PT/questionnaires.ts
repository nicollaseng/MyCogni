import { labelsFor } from '@mycogni/domain'
import type { QuestionnairesMessages } from '../pt-BR/questionnaires'

const labels = labelsFor('pt-PT')

export const questionnaires: QuestionnairesMessages = {
  meta: { title: 'Questionário' },
  label: 'Questionário',
  areas: {
    depression: 'Sobre o ânimo',
    anxiety: 'Sobre a ansiedade',
    trauma: 'Sobre lembranças de um acontecimento difícil',
    attention: 'Sobre atenção e agitação',
    distress: 'Sobre como se tem sentido',
  },
  names: {
    depression: 'Desânimo',
    anxiety: 'Ansiedade',
    trauma: 'Lembranças de um acontecimento difícil',
    attention: 'Desatenção e agitação',
    distress: 'Mal-estar emocional',
  },
  levels: labels.plainLevels,
  size: '{count, plural, =0 {# perguntas} one {# pergunta} other {# perguntas}} · cerca de {minutes} min',
  card: {
    title: 'O seu profissional disponibilizou um questionário',
    open: 'Responder',
    resume: 'Continuar',
    more: '{count, plural, =0 {Não há mais questionários} one {Há mais # questionário} other {Há mais # questionários}} para responder.',
    all: 'Ver todos',
  },
  list: {
    title: 'Questionários',
    open: 'Para responder',
    answered: 'Respondidos',
    empty: 'Quando o seu profissional disponibilizar um questionário, ele aparece aqui.',
    noneAnswered: 'Ainda não respondeu a nenhum questionário.',
    from: 'De {name}',
    progress: '{answered} de {total} respondidas',
    answeredOn: 'Respondido a {date}',
    careful: 'Algumas respostas pedem cuidado',
    start: 'Responder',
    resume: 'Continuar',
  },
  intro: {
    message: 'Mensagem de {name}',
    notice:
      'O seu profissional verá as suas respostas completas. Verá um resumo simples. Isto não é um diagnóstico.',
    pause: 'Pode parar quando quiser e continuar depois.',
    start: 'Começar',
    later: 'Agora não',
  },
  question: {
    back: 'Voltar',
    pause: 'Pausar',
    progress: 'Pergunta {current} de {total}',
    saving: 'A guardar…',
    retry: 'Tentar de novo',
  },
  summary: {
    title: 'Obrigado por responder.',
    talk: 'Fale com o seu profissional sobre isto.',
    notDiagnosis: 'É uma triagem, não um diagnóstico.',
    safety:
      'Algumas respostas pedem cuidado. O seu profissional vai ver o que respondeu, mas não acompanha a app a toda a hora.',
    lines: 'Se pensar em magoar-se, ligue:',
    today: 'Voltar a Hoje',
    list: 'Ver questionários',
    sentences: {
      depression: {
        low: 'Nos últimos 14 dias, as suas respostas mostram poucos sinais de desânimo. Isto não exclui que algo precise de atenção.',
        mild: 'Nos últimos 14 dias, as suas respostas mostram sinais ligeiros de desânimo.',
        moderate: 'Nos últimos 14 dias, as suas respostas mostram sinais moderados de desânimo.',
        high: 'Nos últimos 14 dias, as suas respostas mostram sinais intensos de desânimo.',
      },
      anxiety: {
        low: 'Nos últimos 14 dias, as suas respostas mostram poucos sinais de ansiedade. Isto não exclui que algo precise de atenção.',
        mild: 'Nos últimos 14 dias, as suas respostas mostram sinais ligeiros de ansiedade.',
        moderate: 'Nos últimos 14 dias, as suas respostas mostram sinais moderados de ansiedade.',
        high: 'Nos últimos 14 dias, as suas respostas mostram sinais intensos de ansiedade.',
      },
      trauma: {
        low: 'No último mês, as suas respostas mostram pouco incómodo com lembranças de um acontecimento difícil. Isto não exclui que algo precise de atenção.',
        mild: 'No último mês, as suas respostas mostram um incómodo ligeiro com lembranças de um acontecimento difícil.',
        moderate:
          'No último mês, as suas respostas mostram um incómodo moderado com lembranças de um acontecimento difícil.',
        high: 'No último mês, as suas respostas mostram um incómodo intenso com lembranças de um acontecimento difícil.',
      },
      attention: {
        low: 'Nos últimos 6 meses, as suas respostas mostram poucos sinais de desatenção e agitação. Isto não exclui que algo precise de atenção.',
        mild: 'Nos últimos 6 meses, as suas respostas mostram alguns sinais de desatenção e agitação.',
        moderate:
          'Nos últimos 6 meses, as suas respostas mostram sinais frequentes de desatenção e agitação.',
        high: 'Nos últimos 6 meses, as suas respostas mostram sinais muito frequentes de desatenção e agitação.',
      },
      distress: {
        low: 'Nos últimos 30 dias, as suas respostas mostram pouco mal-estar emocional. Isto não exclui que algo precise de atenção.',
        mild: 'Nos últimos 30 dias, as suas respostas mostram um mal-estar emocional ligeiro.',
        moderate: 'Nos últimos 30 dias, as suas respostas mostram um mal-estar emocional moderado.',
        high: 'Nos últimos 30 dias, as suas respostas mostram um mal-estar emocional intenso.',
      },
    },
  },
  support: {
    continue: 'Ver o resumo',
  },
  closed: {
    title: 'Este questionário já não está disponível.',
    body: 'O seu profissional pode disponibilizar outro quando fizer sentido.',
    back: 'Voltar',
  },
  errors: {
    save: 'Não foi possível guardar agora. Tente de novo dentro de instantes.',
    closed: 'Este questionário já não está disponível.',
    language:
      'Este questionário não tem versão oficial no idioma da app. Mude o idioma em Perfil ou fale com o seu profissional.',
  },
}
