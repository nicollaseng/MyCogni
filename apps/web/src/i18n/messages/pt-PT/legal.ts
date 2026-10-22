import type { LegalMessages } from '../pt-BR/legal'

export const legal: LegalMessages = {
  draftNotice:
    'Versão preliminar de 22 de outubro de 2026. O texto final será sujeito a revisão jurídica antes do lançamento.',
  privacy: {
    title: 'Política de privacidade',
    summary:
      'Como o MyCogniAI trata os seus dados, porque os trata e o que pode fazer com eles a qualquer momento.',
    sections: {
      collected: {
        heading: 'O que recolhemos',
        body: 'Email, nome e fotografia, se os quiser indicar. Os seus registos de humor, emoções, contexto e notas. As suas respostas ao PHQ-9, ao GAD-7 e ao WHO-5. As conversas com o Cogni e as memórias que ele guarda.',
      },
      purpose: {
        heading: 'Porque recolhemos',
        body: 'Para mostrar os seus registos, calcular os padrões dos seus dias e, se ativar esta opção, gerar resumos escritos por IA. Nada mais do que isso.',
      },
      legalBasis: {
        heading: 'Base legal',
        body: 'Os registos de humor e as respostas a questionários são dados pessoais sensíveis relativos à saúde, nos termos do artigo 11 da LGPD (Lei Geral de Proteção de Dados Pessoais do Brasil). Tratamos estes dados com o seu consentimento específico, que pode revogar quando quiser.',
      },
      ai: {
        heading: 'Inteligência artificial',
        body: 'Os resumos são escritos a partir de estatísticas calculadas sobre os seus registos, sem o seu nome nem email. A IA é opcional e pode ser desativada a qualquer momento. Os seus dados não são usados para treinar modelos.',
      },
      memories: {
        heading: 'Memórias do Cogni',
        body: 'O Cogni, o parceiro virtual da aplicação, guarda frases curtas sobre o que conta nas notas dos registos, nos complementos, nas conversas com ele e, se permitir que ele leia o MyBook, nas páginas do MyBook. Servem para personalizar as conversas e para perceber tendências e sinais de risco, nunca para fazer diagnósticos. As memórias estão ligadas por predefinição e pode desligá-las em Privacidade e dados. Em Perfil e definições → Memórias vê, edita, adiciona e apaga cada uma ou todas, e elas fazem parte da exportação dos seus dados. Apagar um registo apaga o que foi aprendido apenas com ele. Os profissionais só verão as memórias que escolher partilhar.',
      },
      voice: {
        heading: 'Mensagens de voz',
        body: 'Se falar com o Cogni por voz, o áudio é enviado a um fornecedor de transcrição apenas para ser convertido em texto. Nós não guardamos o áudio.',
      },
      sharing: {
        heading: 'Com quem partilhamos',
        body: 'Apenas com os fornecedores que operam o serviço, como alojamento, base de dados, envio de email e, se ativar essa funcionalidade, IA, sempre ao abrigo de contrato e apenas no que for necessário. Nunca vendemos os seus dados nem os usamos para publicidade.',
      },
      rights: {
        heading: 'Os seus direitos',
        body: 'Pode aceder aos seus dados, corrigi-los, exportá-los e eliminá-los, bem como revogar consentimentos, diretamente na aplicação. Eliminar a conta remove todos os seus registos.',
      },
    },
  },
  update: {
    meta: { title: 'Termos atualizados' },
    title: 'Atualizámos os termos',
    lead: 'Agora o Cogni pode guardar memórias do que conta, para conversar melhor consigo. Vê, edita ou apaga cada uma em Perfil e definições → Memórias e pode desligá-las quando quiser.',
    accept:
      'Li e aceito os <terms>Termos de utilização</terms> e a <privacy>Política de privacidade</privacy>.',
    continue: 'Aceitar e continuar',
    signOut: 'Terminar sessão',
  },
  terms: {
    title: 'Termos de utilização',
    summary: 'As regras para utilizar o MyCogniAI, escritas para serem lidas.',
    sections: {
      about: {
        heading: 'O que é o MyCogniAI',
        body: 'Uma ferramenta de autoconhecimento e de rastreio de sinais de ansiedade e depressão. Não é um serviço de saúde, não faz diagnósticos e não substitui o acompanhamento de um profissional.',
      },
      cogni: {
        heading: 'O Cogni',
        body: 'O Cogni é um parceiro virtual com inteligência artificial, não um psicólogo nem um serviço de saúde. Pode guardar memórias do que conta para conversar melhor consigo, como explica a Política de privacidade. Controla essas memórias e pode desligá-las quando quiser.',
      },
      crisis: {
        heading: 'Em caso de crise',
        body: 'O MyCogniAI não é um serviço de emergência. Se está em crise ou a pensar em magoar-se, ligue para o SNS\u00a024 através do 808\u00a024\u00a024\u00a024 (opção 4) ou para o 112.',
      },
      account: {
        heading: 'A sua conta',
        body: 'A utilização é permitida a partir dos 18 anos. É responsável por manter o acesso à sua conta em segurança.',
      },
      acceptableUse: {
        heading: 'Utilização aceitável',
        body: 'Não utilize o serviço para prejudicar outras pessoas, tentar aceder a dados que não são seus ou interferir no funcionamento do sistema.',
      },
      changes: {
        heading: 'Alterações',
        body: 'Se estes termos mudarem de forma relevante, será avisado antes de a alteração entrar em vigor.',
      },
    },
  },
}
