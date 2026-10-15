import type { Locale } from '../i18n/locales.ts'
import type { AssistantMode } from './assistant.ts'

export const noticeKinds = ['crisis', 'refusal', 'unavailable'] as const

export type NoticeKind = (typeof noticeKinds)[number]

type Notices = Readonly<Record<NoticeKind, string>>

const brazilian: Readonly<Record<AssistantMode, Notices>> = {
  personal: {
    crisis:
      'Que bom que você me contou. O que você está sentindo importa, e você merece o apoio de uma pessoa agora. Se puder, ligue para um dos contatos abaixo ou fale com o profissional que acompanha você. Se estiver em perigo neste momento, ligue para a emergência. Eu continuo aqui para conversar, mas não substituo esse apoio.',
    refusal:
      'Não posso ajudar com esse pedido. Posso conversar sobre como você está e sobre os seus registros. Se precisar de apoio agora, os contatos abaixo atendem a qualquer hora.',
    unavailable:
      'Não consegui responder agora. Tente de novo em alguns instantes. Se precisar de apoio agora, os contatos abaixo atendem a qualquer hora.',
  },
  professional: {
    crisis:
      'Há sinais de risco nesta conversa. Siga o seu protocolo de segurança e, se houver risco imediato, acione os serviços de emergência.',
    refusal:
      'Não posso ajudar com esse pedido. Posso responder sobre os registros que este paciente compartilha com você.',
    unavailable: 'Não consegui responder agora. Tente de novo em alguns instantes.',
  },
}

const european: Readonly<Record<AssistantMode, Notices>> = {
  personal: {
    crisis:
      'Ainda bem que me contou. O que está a sentir importa e merece o apoio de uma pessoa agora. Se puder, ligue para um dos contactos abaixo ou fale com o profissional que segue o seu caso. Se estiver em perigo neste momento, ligue para a emergência. Continuo aqui para conversar, mas não substituo esse apoio.',
    refusal:
      'Não posso ajudar com esse pedido. Posso conversar sobre como está e sobre os seus registos. Se precisar de apoio agora, os contactos abaixo atendem a qualquer hora.',
    unavailable:
      'Não consegui responder agora. Tente novamente dentro de instantes. Se precisar de apoio agora, os contactos abaixo atendem a qualquer hora.',
  },
  professional: {
    crisis:
      'Há sinais de risco nesta conversa. Siga o seu protocolo de segurança e, se houver risco imediato, contacte os serviços de emergência.',
    refusal:
      'Não posso ajudar com esse pedido. Posso responder sobre os registos que este paciente partilha consigo.',
    unavailable: 'Não consegui responder agora. Tente novamente dentro de instantes.',
  },
}

const english: Readonly<Record<AssistantMode, Notices>> = {
  personal: {
    crisis:
      'I’m glad you told me. What you are feeling matters, and you deserve support from a person right now. If you can, call one of the contacts below or reach out to the professional who supports you. If you are in danger right now, call emergency services. I’m still here to talk, but I can’t replace that support.',
    refusal:
      'I can’t help with that request. I can talk about how you are doing and about your records. If you need support now, the contacts below answer at any time.',
    unavailable:
      'I couldn’t answer just now. Please try again in a moment. If you need support now, the contacts below answer at any time.',
  },
  professional: {
    crisis:
      'There are signs of risk in this conversation. Follow your safety protocol and, if there is immediate risk, contact emergency services.',
    refusal:
      'I can’t help with that request. I can answer about the records this patient shares with you.',
    unavailable: 'I couldn’t answer just now. Please try again in a moment.',
  },
}

const noticesByLocale: Readonly<Record<Locale, Readonly<Record<AssistantMode, Notices>>>> = {
  'pt-BR': brazilian,
  'pt-PT': european,
  'en-US': english,
  'en-GB': english,
}

export function assistantNotice(locale: Locale, mode: AssistantMode, kind: NoticeKind): string {
  return noticesByLocale[locale][mode][kind]
}
