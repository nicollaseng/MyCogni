import type { AssistantModel, AssistantRequest } from './assistant-model.ts'

const countPattern = /"checkInsInLast90Days":(\d+)/

const someoneElse = /\b(amig[oa]|friend)\b/i

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
      `Nos seus registros dos últimos 90 dias aparecem ${count} check-ins. Os dias com caminhada e boas noites de sono costumam vir com o humor mais alto. Uma ideia simples para esta semana: repetir a caminhada curta depois do almoço.`,
    private:
      'Não consigo ver os seus registros, porque você ainda não permitiu. Posso conversar sobre como você está e sugerir coisas simples para o dia.',
  },
  en: {
    counted: (count: string) =>
      `Your records from the last 90 days show ${count} check-ins. Days with a walk and a good night of sleep tend to come with a higher mood. A simple idea for this week: repeat the short walk after lunch.`,
    private:
      'I can’t see your records because you haven’t allowed it yet. I can still talk about how you feel and suggest small things for the day.',
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
        return { kind: 'answer', text: thirdParty[english ? 'en' : 'pt'], risk: 'urgent' }
      }
      const risk = watch ? 'watch' : 'none'
      if (request.tools.length === 0) {
        return { kind: 'answer', text: copy.private, risk }
      }
      const result = await request.runTool({ name: 'read_patterns', input: {} })
      const count = countPattern.exec(result)?.[1] ?? '0'
      const text = professional ? clinical[english ? 'en' : 'pt'](count) : copy.counted(count)
      return { kind: 'answer', text, risk }
    },
  }
}
