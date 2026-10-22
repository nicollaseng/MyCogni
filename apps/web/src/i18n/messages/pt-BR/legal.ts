export const legal = {
  draftNotice:
    'Versão preliminar de 22 de outubro de 2026. O texto final passa por revisão jurídica antes do lançamento.',
  privacy: {
    title: 'Política de privacidade',
    summary:
      'Como o MyCogniAI trata seus dados, por que trata e o que você pode fazer com eles a qualquer momento.',
    sections: {
      collected: {
        heading: 'O que coletamos',
        body: 'Email, nome e foto, se você quiser informar. Seus registros de humor, emoções, contexto e notas. Suas respostas ao PHQ-9, ao GAD-7 e ao WHO-5. As conversas com o Cogni e as memórias que ele guarda.',
      },
      purpose: {
        heading: 'Por que coletamos',
        body: 'Para mostrar seus registros, calcular os padrões dos seus dias e, se você ativar, gerar resumos escritos por IA. Nada além disso.',
      },
      legalBasis: {
        heading: 'Base legal',
        body: 'Registros de humor e respostas a questionários são dados pessoais sensíveis de saúde, nos termos do artigo 11 da LGPD. Tratamos esses dados com o seu consentimento específico, que você pode revogar quando quiser.',
      },
      ai: {
        heading: 'Inteligência artificial',
        body: 'Os resumos são escritos a partir de estatísticas calculadas sobre os seus registros, sem seu nome ou email. A IA é opcional e pode ser desligada a qualquer momento. Seus dados não são usados para treinar modelos.',
      },
      memories: {
        heading: 'Memórias do Cogni',
        body: 'O Cogni, o parceiro virtual do app, guarda frases curtas sobre o que você conta nas notas dos registros, nos complementos, nas conversas com ele e, se você permitir que ele leia o MyBook, nas páginas do MyBook. Elas servem para personalizar as conversas e para perceber tendências e sinais de risco, nunca para fazer diagnóstico. As memórias vêm ligadas por padrão e você pode desligar em Privacidade e dados. Em Perfil e configurações → Memórias você vê, edita, adiciona e apaga cada uma ou todas, e elas entram na exportação dos seus dados. Apagar um registro apaga o que foi aprendido só com ele. Profissionais só verão memórias que você escolher compartilhar.',
      },
      voice: {
        heading: 'Mensagens de voz',
        body: 'Se você falar com o Cogni por voz, o áudio vai para um fornecedor de transcrição só para virar texto. Nós não guardamos o áudio.',
      },
      zenStats: {
        heading: 'Uso agregado do Zen',
        body: 'Para melhorar o Zen, olhamos números agregados e sem identificação, como quantas pessoas concluem uma meditação e como se sentem depois. Nunca olhamos sessões de uma pessoa, e grupos com menos de cinco pessoas ficam de fora.',
      },
      sharing: {
        heading: 'Com quem compartilhamos',
        body: 'Apenas com os fornecedores que operam o serviço, como hospedagem, banco de dados, envio de email e, se você ativar, IA, sempre sob contrato e só no necessário. Nunca vendemos seus dados nem usamos para anúncios.',
      },
      rights: {
        heading: 'Seus direitos',
        body: 'Você pode acessar, corrigir, exportar e apagar seus dados, além de revogar consentimentos, direto no app. Apagar a conta remove todos os seus registros.',
      },
    },
  },
  update: {
    meta: { title: 'Termos atualizados' },
    title: 'Atualizamos os termos',
    lead: 'Agora o Cogni pode guardar memórias do que você conta, para conversar melhor com você. Você vê, edita ou apaga cada uma em Perfil e configurações → Memórias e pode desligar quando quiser.',
    accept:
      'Li e aceito os <terms>Termos de uso</terms> e a <privacy>Política de privacidade</privacy>.',
    continue: 'Aceitar e continuar',
    signOut: 'Sair',
  },
  terms: {
    title: 'Termos de uso',
    summary: 'As regras para usar o MyCogniAI, escritas para serem lidas.',
    sections: {
      about: {
        heading: 'O que o MyCogniAI é',
        body: 'Uma ferramenta de autoconhecimento e de rastreio de sinais de ansiedade e depressão. Não é serviço de saúde, não faz diagnóstico e não substitui acompanhamento profissional.',
      },
      cogni: {
        heading: 'O Cogni',
        body: 'O Cogni é um parceiro virtual com inteligência artificial, não um psicólogo nem um serviço de saúde. Ele pode guardar memórias do que você conta para conversar melhor com você, como explica a Política de privacidade. Você controla essas memórias e pode desligá-las quando quiser.',
      },
      crisis: {
        heading: 'Em caso de crise',
        body: 'O MyCogniAI não é um serviço de emergência. Se você está em crise ou pensando em se machucar, ligue para o CVV no 188 ou para o SAMU no 192.',
      },
      account: {
        heading: 'Sua conta',
        body: 'O uso é permitido a partir dos 18 anos. Você é responsável por manter o acesso à sua conta em segurança.',
      },
      acceptableUse: {
        heading: 'Uso aceitável',
        body: 'Não use o serviço para prejudicar outras pessoas, tentar acessar dados que não são seus ou interferir no funcionamento do sistema.',
      },
      changes: {
        heading: 'Mudanças',
        body: 'Se estes termos mudarem de forma relevante, você será avisado antes de a mudança valer.',
      },
    },
  },
}

export type LegalMessages = typeof legal
