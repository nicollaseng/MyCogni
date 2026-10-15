import { labelsFor } from '@mycogni/domain'
import type { ContextGroupId, EmotionFamilyId } from '@mycogni/domain'

const labels = labelsFor('pt-BR')

export const checkIn = {
  meta: {
    title: 'Check-in',
  },
  flow: {
    back: 'Voltar',
    close: 'Fechar',
    progress: 'Passo {current} de {total}',
    continue: 'Continuar',
    continueWith: 'Continuar com {count}',
    skip: 'Pular',
    save: 'Registrar',
    saving: 'Registrando…',
  },
  mood: {
    question: 'Como você está agora?',
    onlyMood: 'Registrar só o humor',
  },
  emotionStep: {
    title: 'O que você está sentindo?',
    search: 'Buscar ou escrever outra',
  },
  contextStep: {
    title: 'O que tem a ver com isso?',
    search: 'Buscar ou escrever outro',
    noteLabel: 'Nota sobre hoje',
    notePlaceholder: 'Quer anotar algo sobre hoje?',
  },
  picker: {
    suggestions: 'sugestões',
    chosen: 'Escolhidas: <list>{items}</list>',
    add: 'Adicionar {item}',
  },
  done: {
    title: 'Registrado às {time}.',
    days: 'Ver meus dias',
    entries: 'Ver registros',
  },
  errors: {
    save: 'Não conseguimos registrar agora. Tente de novo em instantes.',
  },
  emotionFamilies: {
    anxiety: 'ansiedade',
    sadness: 'tristeza',
    anger: 'raiva',
    exhaustion: 'cansaço',
    mixed: 'misto',
    calm: 'calma',
    energy: 'energia',
    connection: 'conexão',
    joy: 'alegria',
  } satisfies Record<EmotionFamilyId, string>,
  emotions: labels.emotions,
  contextGroups: {
    body: 'corpo',
    people: 'pessoas',
    routine: 'rotina',
    world: 'mundo',
    inner: 'por dentro',
  } satisfies Record<ContextGroupId, string>,
  contexts: labels.contexts,
}

export type CheckInMessages = typeof checkIn
