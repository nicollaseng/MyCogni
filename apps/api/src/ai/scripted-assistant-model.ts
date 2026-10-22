import type { ProposedAction } from '@mycogni/domain'
import type { AssistantModel, AssistantRequest } from './assistant-model.ts'

const countPattern = /"checkInsInLast90Days":(\d+)/

const titlePattern = /"title":"([^"]*)"/

const someoneElse = /\b(amig[oa]|friend)\b/i

const loss = /\b(luto|faleceu|morreu|perdi (a|o|minha|meu)|grief|passed away|died)\b/i

const grief = {
  pt: 'Sinto muito pela sua perda. Saudade, cansaço ou até não sentir nada em alguns dias fazem parte do luto, e não existe um jeito certo de passar por isso. Se quiser, me conte um pouco sobre essa pessoa. O que acha de escrever uma lembrança dela no MyBook?',
  en: 'I am so sorry for your loss. Missing them, feeling tired or even numb on some days is part of grief, and there is no right way to go through it. If you like, tell me a little about them. What if you wrote down one memory of them in MyBook?',
}

const actions = {
  counted: [
    { type: 'article', id: 'sleep-and-mood' },
    { type: 'check_in', id: null },
  ],
  private: [{ type: 'breathe', id: null }],
  grief: [{ type: 'mybook', id: null }],
} as const satisfies Record<string, readonly ProposedAction[]>

const thirdParty = {
  pt: 'Obrigado por me contar. Se ele pode estar em perigo agora, ligue para a emergência nos contatos abaixo e, se estiver com ele, não o deixe sozinho. Ele está em perigo agora? Você está com ele ou consegue falar com ele ou com alguém da família?',
  en: 'Thank you for telling me. If he may be in danger now, call the emergency number in the contacts below and, if you are with him, do not leave him alone. Is he in danger right now? Are you with him, or can you reach him or someone in his family?',
}

const clinical = {
  pt: (count: string) =>
    `Nos registros compartilhados dos últimos 90 dias aparecem ${count} check-ins. O humor fica mais alto nos dias com exercício e sono registrados e mais baixo nos dias com trabalho e deslocamento. Vale explorar em sessão o peso das reuniões longas.`,
  en: (count: string) =>
    `The shared records from the last 90 days show ${count} check-ins. Mood is higher on days with exercise and sleep and lower on days with work and commuting. The weight of long meetings may be worth exploring in session.`,
}

const replies = {
  pt: {
    counted: (count: string) =>
      `Nos seus registros dos últimos 90 dias aparecem ${count} check-ins. Os dias com caminhada e boas noites de sono costumam vir com o humor mais alto. O que acha de repetir a caminhada curta depois do almoço esta semana?`,
    private:
      'Não consigo ver os seus registros, porque você ainda não permitiu. Posso ouvir como você está e sugerir algo simples para hoje. O que acha de começar com um minuto de respiração?',
    page: (title: string) =>
      `Sua página “${title}” fala de um momento que você quis guardar. O que você gostaria de lembrar dele daqui a um tempo?`,
  },
  en: {
    counted: (count: string) =>
      `Your records from the last 90 days show ${count} check-ins. Days with a walk and a good night of sleep tend to come with a higher mood. What if you repeated the short walk after lunch this week?`,
    private:
      'I can’t see your records because you haven’t allowed it yet. I can still hear how you feel and suggest something small for today. What if you started with one minute of breathing?',
    page: (title: string) =>
      `Your page “${title}” is about a moment you wanted to keep. What would you like to remember about it later on?`,
  },
}

export function createScriptedAssistantModel(): AssistantModel {
  return {
    model: 'scripted',
    async answer(request: AssistantRequest) {
      const english = request.notes.some((note) => note.includes('Locale: en'))
      const copy = english ? replies.en : replies.pt
      const professional = request.system.includes('verified health professional')
      const watch = request.notes.some((note) => note.startsWith('Signs of'))
      const latest = request.history.at(-1)?.text ?? ''
      if (!professional && watch && someoneElse.test(latest)) {
        return {
          kind: 'answer',
          text: thirdParty[english ? 'en' : 'pt'],
          risk: 'urgent',
          actions: [],
        }
      }
      const risk = watch ? 'watch' : 'none'
      if (!professional && loss.test(latest)) {
        return { kind: 'answer', text: grief[english ? 'en' : 'pt'], risk, actions: actions.grief }
      }
      if (request.tools.some((tool) => tool.name === 'read_page')) {
        const page = await request.runTool({ name: 'read_page', input: {} })
        return {
          kind: 'answer',
          text: copy.page(titlePattern.exec(page)?.[1] ?? ''),
          risk,
          actions: [],
        }
      }
      if (request.tools.length === 0) {
        return {
          kind: 'answer',
          text: copy.private,
          risk,
          actions: professional ? [] : actions.private,
        }
      }
      const result = await request.runTool({ name: 'read_patterns', input: {} })
      const count = countPattern.exec(result)?.[1] ?? '0'
      return professional
        ? { kind: 'answer', text: clinical[english ? 'en' : 'pt'](count), risk, actions: [] }
        : { kind: 'answer', text: copy.counted(count), risk, actions: actions.counted }
    },
  }
}
