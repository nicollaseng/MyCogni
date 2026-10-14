export interface LegalSection {
  heading: string
  paragraphs: readonly string[]
}

export interface LegalDocument {
  title: string
  summary: string
  sections: readonly LegalSection[]
}

export const draftNotice =
  'Versão preliminar de outubro de 2026. O texto final passa por revisão jurídica antes do lançamento.'

export const privacyPolicy: LegalDocument = {
  title: 'Política de privacidade',
  summary:
    'Como o MyCogniAI trata seus dados, por que trata e o que você pode fazer com eles a qualquer momento.',
  sections: [
    {
      heading: 'O que coletamos',
      paragraphs: [
        'Email, nome e foto, se você quiser informar. Seus registros de humor, emoções, contexto e notas. Suas respostas ao PHQ-9, ao GAD-7 e ao WHO-5.',
      ],
    },
    {
      heading: 'Por que coletamos',
      paragraphs: [
        'Para mostrar seus registros, calcular os padrões dos seus dias e, se você ativar, gerar resumos escritos por IA. Nada além disso.',
      ],
    },
    {
      heading: 'Base legal',
      paragraphs: [
        'Registros de humor e respostas a questionários são dados pessoais sensíveis de saúde, nos termos do artigo 11 da LGPD. Tratamos esses dados com o seu consentimento específico, que você pode revogar quando quiser.',
      ],
    },
    {
      heading: 'Inteligência artificial',
      paragraphs: [
        'Os resumos são escritos a partir de estatísticas calculadas sobre os seus registros, sem seu nome ou email. A IA é opcional e pode ser desligada a qualquer momento. Seus dados não são usados para treinar modelos.',
      ],
    },
    {
      heading: 'Com quem compartilhamos',
      paragraphs: [
        'Apenas com os fornecedores que operam o serviço, como hospedagem, banco de dados, envio de email e, se você ativar, IA, sempre sob contrato e só no necessário. Nunca vendemos seus dados nem usamos para anúncios.',
      ],
    },
    {
      heading: 'Seus direitos',
      paragraphs: [
        'Você pode acessar, corrigir, exportar e apagar seus dados, além de revogar consentimentos, direto no app. Apagar a conta remove todos os seus registros.',
      ],
    },
  ],
}

export const termsOfUse: LegalDocument = {
  title: 'Termos de uso',
  summary: 'As regras para usar o MyCogniAI, escritas para serem lidas.',
  sections: [
    {
      heading: 'O que o MyCogniAI é',
      paragraphs: [
        'Uma ferramenta de autoconhecimento e de rastreio de sinais de ansiedade e depressão. Não é serviço de saúde, não faz diagnóstico e não substitui acompanhamento profissional.',
      ],
    },
    {
      heading: 'Em caso de crise',
      paragraphs: [
        'O MyCogniAI não é um serviço de emergência. Se você está em crise ou pensando em se machucar, ligue para o CVV no 188 ou para o SAMU no 192.',
      ],
    },
    {
      heading: 'Sua conta',
      paragraphs: [
        'O uso é permitido a partir dos 18 anos. Você é responsável por manter o acesso à sua conta em segurança.',
      ],
    },
    {
      heading: 'Uso aceitável',
      paragraphs: [
        'Não use o serviço para prejudicar outras pessoas, tentar acessar dados que não são seus ou interferir no funcionamento do sistema.',
      ],
    },
    {
      heading: 'Mudanças',
      paragraphs: [
        'Se estes termos mudarem de forma relevante, você será avisado antes de a mudança valer.',
      ],
    },
  ],
}
