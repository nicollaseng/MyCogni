export const report = {
  close: 'Fechar',
  cancel: 'Cancelar',
  period: 'Período',
  days: 'Últimos {days} dias',
  content: 'O que entra no arquivo',
  reading: 'Resumo do período',
  readingHint:
    'Entra o resumo mais recente do período, quando houver. É escrito automaticamente e não é um diagnóstico.',
  submit: 'Baixar PDF',
  submitting: 'Gerando o PDF…',
  error: 'Não conseguimos gerar o relatório agora. Tente de novo em instantes.',
  patient: {
    open: 'Exportar relatório',
    title: 'Exportar relatório',
    description:
      'Um PDF com seu humor dia a dia, o que mais apareceu nos registros e seus questionários. O arquivo é seu: guarde ou envie para quem quiser.',
    notes: 'Suas notas',
    notesHint:
      'Ficam de fora porque o arquivo pode ser compartilhado. Inclua só se quiser que quem receber leia o que você escreveu.',
    summary:
      'O PDF terá os últimos {days} dias, {notes, select, true {com suas notas} other {sem suas notas}}{reading, select, true { e com o resumo, se houver} other {}}.',
  },
  professional: {
    open: 'Baixar relatório',
    title: 'Baixar relatório',
    description:
      'Um PDF com o humor, o que mais apareceu e os questionários de {name}, só com os registros que você já vê na ficha.',
    notes: 'Notas da pessoa',
    notesHint:
      'Ficam de fora por padrão. Inclua só se o arquivo ficar no prontuário, sem circular.',
    summary:
      'O PDF terá os últimos {days} dias, {notes, select, true {com as notas} other {sem as notas}}{reading, select, true { e com o resumo, se houver} other {}}.',
  },
}

export type ReportMessages = typeof report
