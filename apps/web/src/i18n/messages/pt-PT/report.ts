import type { ReportMessages } from '../pt-BR/report'

export const report: ReportMessages = {
  close: 'Fechar',
  cancel: 'Cancelar',
  period: 'Período',
  days: 'Últimos {days} dias',
  content: 'O que entra no ficheiro',
  reading: 'Resumo do período',
  readingHint:
    'Entra o resumo mais recente do período, quando existir. É escrito automaticamente e não é um diagnóstico.',
  submit: 'Descarregar PDF',
  submitting: 'A gerar o PDF…',
  error: 'Não foi possível gerar o relatório agora. Tente novamente dentro de instantes.',
  patient: {
    open: 'Exportar relatório',
    title: 'Exportar relatório',
    description:
      'Um PDF com o seu humor dia a dia, o que mais apareceu nos registos e os seus questionários. O ficheiro é seu: guarde-o ou envie-o a quem quiser.',
    notes: 'As suas notas',
    notesHint:
      'Ficam de fora porque o ficheiro pode ser partilhado. Inclua-as apenas se quiser que quem o receber leia o que escreveu.',
    summary:
      'O PDF terá os últimos {days} dias, {notes, select, true {com as suas notas} other {sem as suas notas}}{reading, select, true { e com o resumo, se existir} other {}}.',
  },
  professional: {
    open: 'Descarregar relatório',
    title: 'Descarregar relatório',
    description:
      'Um PDF com o humor, o que mais apareceu e os questionários de {name}, apenas com os registos que já vê na ficha.',
    notes: 'Notas da pessoa',
    notesHint:
      'Ficam de fora por predefinição. Inclua-as apenas se o ficheiro ficar no processo clínico, sem circular.',
    summary:
      'O PDF terá os últimos {days} dias, {notes, select, true {com as notas} other {sem as notas}}{reading, select, true { e com o resumo, se existir} other {}}.',
  },
}
