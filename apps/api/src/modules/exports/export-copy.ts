import type { Locale } from '@mycogni/domain'

export interface ExportCopy {
  readme: (date: string) => string
  checkInHeader: readonly string[]
  memoryHeader: readonly string[]
  untitledPage: string
  untitledConversation: string
  photo: string
  you: string
  cogni: string
  notice: string
  created: string
  updated: string
  emailSubject: string
  emailTitle: string
  emailBody: string
  emailAction: string
  emailPrivacy: string
}

const vocabulary = {
  'pt-BR': {
    title: 'MyCogniAI · Seus dados',
    data: 'dados.json: tudo o que a sua conta guarda, em formato estruturado (veja "schemaVersion").',
    records:
      'registros.csv: seus registros de humor, com notas e complementos, para abrir numa planilha.',
    memories: 'memorias.csv: as memórias que o Cogni guardou e as que você adicionou.',
    pages: 'mybook/: cada página do MyBook como um arquivo HTML que abre sem internet.',
    photos: 'fotos/: as fotos originais do MyBook, com a data e a página no nome.',
    conversations: 'conversas/: as conversas com o Cogni em texto simples (Markdown).',
    profile: 'perfil/: sua foto de perfil, se tiver uma.',
    documents: 'documentos/: os documentos profissionais enviados, se você for profissional.',
    keep: 'Guarde este arquivo num lugar seguro: ele contém dados de saúde.',
  },
  'pt-PT': {
    title: 'MyCogniAI · Os seus dados',
    data: 'dados.json: tudo o que a sua conta guarda, num formato estruturado (veja "schemaVersion").',
    records:
      'registros.csv: os seus registos de humor, com notas e complementos, para abrir numa folha de cálculo.',
    memories: 'memorias.csv: as memórias que o Cogni guardou e as que adicionou.',
    pages: 'mybook/: cada página do MyBook como um ficheiro HTML que abre sem internet.',
    photos: 'fotos/: as fotografias originais do MyBook, com a data e a página no nome.',
    conversations: 'conversas/: as conversas com o Cogni em texto simples (Markdown).',
    profile: 'perfil/: a sua fotografia de perfil, se tiver uma.',
    documents: 'documentos/: os documentos profissionais enviados, se for profissional.',
    keep: 'Guarde este ficheiro num local seguro: contém dados de saúde.',
  },
} as const

const portuguese = (variant: 'pt-BR' | 'pt-PT'): ExportCopy => ({
  readme: (date) => {
    const words = vocabulary[variant]
    return [
      words.title,
      `Preparado em ${date}.`,
      '',
      words.data,
      words.records,
      words.memories,
      words.pages,
      words.photos,
      words.conversations,
      words.profile,
      words.documents,
      '',
      words.keep,
    ].join('\r\n')
  },
  checkInHeader: ['data', 'humor (0 a 6)', 'emoções', 'contextos', 'nota', 'complementos'],
  memoryHeader: ['memória', 'tipo', 'origem', 'estado', 'criada em', 'fontes'],
  untitledPage: 'pagina',
  untitledConversation: 'conversa',
  photo: 'Foto',
  you: variant === 'pt-BR' ? 'Você' : 'Eu',
  cogni: 'Cogni',
  notice: 'Aviso',
  created: 'Criada em',
  updated: 'Atualizada em',
  emailSubject: 'Seus dados estão prontos',
  emailTitle: 'Seus dados estão prontos',
  emailBody:
    variant === 'pt-BR'
      ? 'O arquivo com os seus dados foi preparado. Para baixar, entre no app em Privacidade e dados. Ele fica disponível por 7 dias.'
      : 'O ficheiro com os seus dados foi preparado. Para o descarregar, entre na aplicação em Privacidade e dados. Fica disponível durante 7 dias.',
  emailAction: variant === 'pt-BR' ? 'Abrir no app' : 'Abrir na aplicação',
  emailPrivacy:
    variant === 'pt-BR'
      ? 'Por segurança, este email não traz nenhum dado nem link direto para o arquivo.'
      : 'Por segurança, este email não contém dados nem uma ligação direta para o ficheiro.',
})

const english: ExportCopy = {
  readme: (date) =>
    [
      'MyCogniAI · Your data',
      `Prepared on ${date}.`,
      '',
      'dados.json: everything your account keeps, in a structured format (see "schemaVersion").',
      'registros.csv: your mood check-ins with notes and additions, for a spreadsheet.',
      'memorias.csv: the memories Cogni kept and the ones you added.',
      'mybook/: each MyBook page as an HTML file that opens offline.',
      'fotos/: the original MyBook photos, named by date and page.',
      'conversas/: your conversations with Cogni as plain text (Markdown).',
      'perfil/: your profile photo, if you have one.',
      'documentos/: the professional documents you sent, if you are a professional.',
      '',
      'Keep this file somewhere safe: it contains health data.',
    ].join('\r\n'),
  checkInHeader: ['date', 'mood (0 to 6)', 'emotions', 'contexts', 'note', 'additions'],
  memoryHeader: ['memory', 'kind', 'origin', 'status', 'created at', 'sources'],
  untitledPage: 'page',
  untitledConversation: 'conversation',
  photo: 'Photo',
  you: 'You',
  cogni: 'Cogni',
  notice: 'Notice',
  created: 'Created',
  updated: 'Updated',
  emailSubject: 'Your data is ready',
  emailTitle: 'Your data is ready',
  emailBody:
    'The file with your data has been prepared. To download it, open Privacy and data in the app. It stays available for 7 days.',
  emailAction: 'Open the app',
  emailPrivacy: 'For your safety, this email carries no data and no direct link to the file.',
}

export const exportCopies: Readonly<Record<Locale, ExportCopy>> = {
  'pt-BR': portuguese('pt-BR'),
  'pt-PT': portuguese('pt-PT'),
  'en-US': english,
  'en-GB': english,
}
