import { labelsFor } from '@mycogni/domain'
import type { CheckInMessages } from '../pt-BR/check-in'

const labels = labelsFor('pt-PT')

export const checkIn: CheckInMessages = {
  meta: {
    title: 'Check-in',
  },
  flow: {
    back: 'Voltar',
    close: 'Fechar',
    progress: 'Passo {current} de {total}',
    continue: 'Continuar',
    continueWith: 'Continuar com {count}',
    skip: 'Saltar',
    save: 'Registar',
    saving: 'A registar…',
  },
  mood: {
    question: 'Como se sente agora?',
    onlyMood: 'Registar só o humor',
  },
  emotionStep: {
    title: 'O que está a sentir?',
    search: 'Pesquisar ou escrever outra',
  },
  contextStep: {
    title: 'O que tem a ver com isto?',
    search: 'Pesquisar ou escrever outro',
    noteLabel: 'Nota sobre hoje',
    notePlaceholder: 'Quer anotar algo sobre hoje?',
  },
  picker: {
    suggestions: 'sugestões',
    chosen: 'Escolhidas: <list>{items}</list>',
    add: 'Adicionar {item}',
  },
  done: {
    title: 'Registado às {time}.',
    days: 'Ver os meus dias',
    entries: 'Ver registos',
  },
  errors: {
    save: 'Não foi possível registar agora. Tente novamente dentro de instantes.',
  },
  emotionFamilies: {
    anxiety: 'ansiedade',
    sadness: 'tristeza',
    anger: 'raiva',
    exhaustion: 'cansaço',
    mixed: 'misto',
    calm: 'calma',
    energy: 'energia',
    connection: 'ligação',
    joy: 'alegria',
  },
  emotions: labels.emotions,
  contextGroups: {
    body: 'corpo',
    people: 'pessoas',
    routine: 'rotina',
    world: 'mundo',
    inner: 'por dentro',
  },
  contexts: labels.contexts,
}
