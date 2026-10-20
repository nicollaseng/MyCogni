import type { Article } from '../types.ts'

export const screeningNotDiagnosis: Article = {
  id: 'screening-not-diagnosis',
  text: {
    'pt-BR': {
      title: 'Triagem não é diagnóstico',
      summary:
        'As perguntas sobre desânimo e ansiedade que você responde no app mostram a intensidade desses sinais nas últimas semanas. Elas ajudam a acompanhar e a decidir quando buscar ajuda, mas não dizem o que você tem.',
      sections: [
        {
          heading: 'O que as perguntas medem',
          paragraphs: [
            'São dois questionários curtos, usados no mundo todo. Um tem nove perguntas sobre desânimo nas últimas duas semanas, como pouco interesse pelas coisas, tristeza, sono e cansaço. O outro tem sete perguntas sobre ansiedade, como preocupação difícil de controlar, tensão e inquietação. Em cada pergunta, você diz com que frequência aquilo aconteceu.',
            'Suas respostas viram um nível: baixo, leve, moderado ou alto. Esses níveis vêm dos estudos que criaram os questionários e foram testados com milhares de pessoas. Os autores recomendam uma avaliação mais completa quando o nível chega a moderado ou acima.',
          ],
        },
        {
          heading: 'Por que não é diagnóstico',
          paragraphs: [
            'Diagnóstico é uma conclusão clínica. Ele leva em conta sua história, há quanto tempo os sinais existem, o quanto atrapalham a vida, outras condições de saúde que podem explicar o que você sente e o que mais está acontecendo. Um questionário não enxerga nada disso.',
            'No estudo original das perguntas sobre desânimo, o nível moderado ou acima encontrou cerca de nove em cada dez pessoas com depressão confirmada por entrevista com um profissional, e deixou de fora cerca de nove em cada dez pessoas sem ela. Uma análise de 2019, com dados de mais de dezessete mil participantes, encontrou números parecidos. São resultados bons para uma triagem, mas que deixam espaço para erros nos dois sentidos.',
            'Outra análise, de 2020, mostrou o tamanho desse espaço: entre mais de nove mil pessoas, cerca de uma em cada quatro ficou no nível moderado ou acima, mas só cerca de uma em cada oito preenchia os critérios de depressão numa entrevista diagnóstica com um profissional. Ou seja, as respostas sozinhas tendem a apontar mais casos do que existem de fato.',
          ],
        },
        {
          heading: 'O que um nível alto significa',
          paragraphs: [
            'Um nível alto é um sinal para conversar com um profissional, não uma sentença. A força-tarefa de prevenção dos Estados Unidos, que recomenda a triagem de depressão em adultos, deixa claro que todo resultado que chama atenção precisa de uma avaliação adicional para confirmar o diagnóstico e entender a gravidade.',
            'O mesmo vale para a última pergunta sobre desânimo, que fala de pensamentos de morte ou de se machucar. Qualquer resposta diferente de "nenhuma vez" merece atenção, e o manual dos autores lembra que avaliar o risco de verdade exige uma conversa clínica. Por isso o app mostra contatos de ajuda sempre que isso acontece.',
          ],
        },
        {
          heading: 'O que um nível baixo significa',
          paragraphs: [
            'Um nível baixo também não garante que está tudo bem. Se você sente que algo mudou, se está sofrendo ou se as pessoas próximas estão preocupadas, vale procurar ajuda, qualquer que seja o resultado.',
          ],
        },
        {
          heading: 'E outros questionários?',
          paragraphs: [
            'Existem questionários de triagem para outros quadros, como o transtorno bipolar. Mesmo assim, o NICE orienta a não usar questionários na atenção primária para identificar transtorno bipolar em adultos: o caminho é perguntar sobre a história de humor e encaminhar para avaliação especializada quando houver sinais. No app, só usamos instrumentos validados cuja licença e tradução oficial permitem o uso, e sempre como triagem.',
          ],
        },
        {
          heading: 'Como usar bem suas respostas',
          paragraphs: [
            'Responda a cada duas semanas, pensando em como as coisas foram de verdade. Observe a tendência ao longo do tempo, mais do que um resultado isolado. Leve suas respostas e seus registros para a conversa com o profissional que acompanha você; eles ajudam a contar sua história.',
          ],
        },
      ],
    },
    'pt-PT': {
      title: 'Rastreio não é diagnóstico',
      summary:
        'As perguntas sobre desânimo e ansiedade a que responde na app mostram a intensidade destes sinais nas últimas semanas. Ajudam a acompanhar e a decidir quando procurar ajuda, mas não dizem o que tem.',
      sections: [
        {
          heading: 'O que as perguntas medem',
          paragraphs: [
            'São dois questionários curtos, usados em todo o mundo. Um tem nove perguntas sobre desânimo nos últimos 14 dias, como pouco interesse pelas coisas, tristeza, sono e cansaço. O outro tem sete perguntas sobre ansiedade, como preocupação difícil de controlar, tensão e inquietação. Em cada pergunta, indica com que frequência isso aconteceu.',
            'As suas respostas dão um nível: baixo, ligeiro, moderado ou alto. Estes níveis vêm dos estudos que criaram os questionários e foram testados com milhares de pessoas. Os autores recomendam uma avaliação mais completa quando o nível chega a moderado ou acima.',
          ],
        },
        {
          heading: 'Porque não é diagnóstico',
          paragraphs: [
            'O diagnóstico é uma conclusão clínica. Tem em conta a sua história, há quanto tempo os sinais existem, o quanto interferem na sua vida, outras condições de saúde que podem explicar o que sente e o que mais está a acontecer. Um questionário não vê nada disso.',
            'No estudo original das perguntas sobre desânimo, o nível moderado ou acima encontrou cerca de nove em cada dez pessoas com depressão major confirmada por entrevista com um profissional, e deixou de fora cerca de nove em cada dez pessoas sem ela. Uma análise de 2019, com dados de mais de dezassete mil participantes, encontrou números semelhantes. São bons resultados para um rastreio, mas deixam margem para erros nos dois sentidos.',
            'Outra análise, de 2020, mostrou o tamanho dessa margem: entre mais de nove mil pessoas, cerca de uma em cada quatro ficou no nível moderado ou acima, mas só cerca de uma em cada oito cumpria os critérios de depressão major numa entrevista diagnóstica com um profissional. Ou seja, as respostas sozinhas tendem a apontar mais casos do que os que existem de facto.',
          ],
        },
        {
          heading: 'O que significa um nível alto',
          paragraphs: [
            'Um nível alto é um sinal para falar com um profissional, não uma sentença. O grupo de trabalho de prevenção dos Estados Unidos, que recomenda o rastreio da depressão em adultos, deixa claro que qualquer resultado que chame a atenção precisa de uma avaliação adicional para confirmar o diagnóstico e perceber a gravidade.',
            'O mesmo se aplica à última pergunta sobre desânimo, que fala de pensamentos de morte ou de se magoar. Qualquer resposta diferente de "nunca" merece atenção, e o manual dos autores lembra que avaliar o risco a sério exige uma conversa clínica. Por isso a app mostra contactos de ajuda sempre que isso acontece.',
          ],
        },
        {
          heading: 'O que significa um nível baixo',
          paragraphs: [
            'Um nível baixo também não garante que está tudo bem. Se sente que algo mudou, se está a sofrer ou se as pessoas próximas estão preocupadas, vale a pena procurar ajuda, seja qual for o resultado.',
          ],
        },
        {
          heading: 'E outros questionários?',
          paragraphs: [
            'Existem questionários de rastreio para outros quadros, como a perturbação bipolar. Ainda assim, o NICE recomenda não usar questionários nos cuidados de saúde primários para identificar a perturbação bipolar em adultos: o caminho é perguntar pela história do humor e encaminhar para avaliação especializada quando houver sinais. Na app, só usamos instrumentos validados cuja licença e tradução oficial permitem o uso, e sempre como rastreio.',
          ],
        },
        {
          heading: 'Como usar bem as suas respostas',
          paragraphs: [
            'Responda de duas em duas semanas, a pensar em como as coisas correram de verdade. Observe a tendência ao longo do tempo, mais do que um resultado isolado. Leve as suas respostas e os seus registos para a conversa com o profissional que o/a acompanha; ajudam a contar a sua história.',
          ],
        },
      ],
    },
    en: {
      title: 'Screening is not diagnosis',
      summary:
        'The questions about feeling down and anxiety that you answer in the app show how intense these signs have been in recent weeks. They help you keep track and decide when to seek help, but they do not tell you what you have.',
      sections: [
        {
          heading: 'What the questions measure',
          paragraphs: [
            'They are two short questionnaires used around the world. One asks nine questions about feeling down over the last two weeks, such as little interest in things, sadness, sleep and tiredness. The other asks seven questions about anxiety, such as worry that is hard to control, tension and restlessness. For each question, you say how often it happened.',
            'Your answers become a level: low, mild, moderate or high. These levels come from the studies that created the questionnaires and were tested with thousands of people. The authors recommend a fuller assessment when the level reaches moderate or above.',
          ],
        },
        {
          heading: 'Why it is not a diagnosis',
          paragraphs: [
            'A diagnosis is a clinical conclusion. It takes into account your history, how long the signs have been there, how much they get in the way of your life, other health conditions that could explain what you feel, and whatever else is going on. A questionnaire sees none of that.',
            'In the original study of the questions about feeling down, a moderate level or above picked out about nine in ten people with major depression confirmed by a professional interview, and left out about nine in ten people without it. A 2019 analysis using data from more than seventeen thousand participants found similar numbers. These are good results for a screening, but they leave room for mistakes in both directions.',
            'Another analysis, from 2020, showed how much room: among more than nine thousand people, about one in four had a moderate level or above, but only about one in eight met the criteria for major depression in a diagnostic interview with a professional. In other words, the answers alone tend to point to more cases than there really are.',
          ],
        },
        {
          heading: 'What a high level means',
          paragraphs: [
            'A high level is a signal to talk to a professional, not a verdict. The US Preventive Services Task Force, which recommends screening adults for depression, makes clear that any result that stands out needs a further assessment to confirm the diagnosis and understand how severe it is.',
            'The same goes for the last question about feeling down, about thoughts of death or of hurting yourself. Any answer other than "not at all" deserves attention, and the authors’ manual notes that properly assessing risk requires a clinical conversation. That is why the app shows help contacts whenever this happens.',
          ],
        },
        {
          heading: 'What a low level means',
          paragraphs: [
            'A low level does not guarantee that all is well either. If you feel something has changed, if you are struggling or if people close to you are worried, it is worth seeking help, whatever the result.',
          ],
        },
        {
          heading: 'What about other questionnaires?',
          paragraphs: [
            'Screening questionnaires exist for other conditions, such as bipolar disorder. Even so, NICE advises against using questionnaires in primary care to identify bipolar disorder in adults: the way forward is to ask about a person’s history of mood and refer them for a specialist assessment when there are signs. In the app we only use validated instruments whose licence and official translation allow it, and always as screening.',
          ],
        },
        {
          heading: 'Using your answers well',
          paragraphs: [
            'Answer every two weeks, thinking about how things have really been. Look at the trend over time more than at any single result. Take your answers and your check-ins to the conversation with the professional who sees you; they help tell your story.',
          ],
        },
      ],
    },
  },
  references: [
    {
      citation:
        'Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med. 2001;16(9):606–613. doi:10.1046/j.1525-1497.2001.016009606.x',
      url: 'https://pubmed.ncbi.nlm.nih.gov/11556941/',
    },
    {
      citation:
        'Spitzer RL, Kroenke K, Williams JB, Löwe B. A brief measure for assessing generalized anxiety disorder: the GAD-7. Arch Intern Med. 2006;166(10):1092–1097. doi:10.1001/archinte.166.10.1092',
      url: 'https://pubmed.ncbi.nlm.nih.gov/16717171/',
    },
    {
      citation:
        'Spitzer RL, Williams JBW, Kroenke K, et al. Instruction manual: instructions for Patient Health Questionnaire (PHQ) and GAD-7 measures.',
      url: 'https://www.phqscreeners.com/images/sites/g/files/g10016261/f/201412/instructions.pdf',
    },
    {
      citation:
        'Levis B, Benedetti A, Thombs BD; DEPRESSD Collaboration. Accuracy of Patient Health Questionnaire-9 (PHQ-9) for screening to detect major depression: individual participant data meta-analysis. BMJ. 2019;365:l1476. doi:10.1136/bmj.l1476',
      url: 'https://pubmed.ncbi.nlm.nih.gov/30967483/',
    },
    {
      citation:
        'Levis B, Benedetti A, Ioannidis JPA, et al. Patient Health Questionnaire-9 scores do not accurately estimate depression prevalence: individual participant data meta-analysis. J Clin Epidemiol. 2020;122:115–128.e1. doi:10.1016/j.jclinepi.2020.02.002',
      url: 'https://pubmed.ncbi.nlm.nih.gov/32105798/',
    },
    {
      citation:
        'US Preventive Services Task Force. Screening for depression and suicide risk in adults: recommendation statement. JAMA. 2023;329(23):2057–2067. doi:10.1001/jama.2023.9297',
      url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/screening-depression-suicide-risk-adults',
    },
    {
      citation:
        'National Institute for Health and Care Excellence. Bipolar disorder: assessment and management (CG185). 2014, updated 2025.',
      url: 'https://www.nice.org.uk/guidance/cg185/chapter/Recommendations',
    },
  ],
}
