import type { Article } from '../types.ts'

export const screeningNotDiagnosis: Article = {
  id: 'screening-not-diagnosis',
  text: {
    'pt-BR': {
      title: 'Triagem não é diagnóstico',
      summary:
        'O PHQ-9 e o GAD-7 mostram a intensidade de sinais de depressão e de ansiedade. Eles ajudam a acompanhar e a decidir quando buscar ajuda, mas não dizem o que você tem.',
      sections: [
        {
          heading: 'O que os questionários medem',
          paragraphs: [
            'O PHQ-9 tem nove perguntas sobre sinais de depressão nas últimas duas semanas, como pouco interesse, desânimo, sono e cansaço. Cada resposta vale de 0 a 3, e o total vai de 0 a 27. O GAD-7 faz o mesmo com sete sinais de ansiedade, com total de 0 a 21.',
            'As faixas de pontuação vêm dos estudos que criaram os questionários. No PHQ-9, 5, 10, 15 e 20 marcam o início das faixas leve, moderada, moderadamente grave e grave. No GAD-7, 5, 10 e 15 marcam as faixas leve, moderada e grave, e o manual dos autores recomenda uma avaliação mais completa a partir de 10.',
          ],
        },
        {
          heading: 'Por que não é diagnóstico',
          paragraphs: [
            'Diagnóstico é uma conclusão clínica. Ele leva em conta sua história, há quanto tempo os sinais existem, o quanto atrapalham a vida, outras condições de saúde que podem explicar o que você sente e o que mais está acontecendo. Um questionário não enxerga nada disso.',
            'No estudo original do PHQ-9, a pontuação 10 ou mais identificou corretamente 88% das pessoas com depressão maior confirmada por entrevista com um profissional, e 88% das pessoas sem ela. Uma análise de 2019, com dados de mais de dezessete mil participantes, encontrou números parecidos. São resultados bons para uma triagem, mas que deixam espaço para erros nos dois sentidos.',
            'Outra análise, de 2020, mostrou o tamanho desse espaço: entre mais de nove mil pessoas, 24,6% tiveram PHQ-9 de 10 ou mais, mas só 12,1% preenchiam os critérios de depressão maior numa entrevista diagnóstica com um profissional. Ou seja, a pontuação sozinha tende a apontar mais casos do que existem de fato.',
          ],
        },
        {
          heading: 'O que um resultado alto significa',
          paragraphs: [
            'Um resultado alto é um sinal para conversar com um profissional, não uma sentença. A força-tarefa de prevenção dos Estados Unidos, que recomenda a triagem de depressão em adultos, deixa claro que todo resultado positivo precisa de uma avaliação adicional para confirmar o diagnóstico e entender a gravidade.',
            'O mesmo vale para o item 9 do PHQ-9, sobre pensamentos de morte ou de se machucar. Qualquer resposta acima de zero merece atenção, e o manual dos autores lembra que avaliar o risco de verdade exige uma conversa clínica. Por isso o app mostra contatos de ajuda sempre que isso acontece.',
          ],
        },
        {
          heading: 'O que um resultado baixo significa',
          paragraphs: [
            'Um resultado baixo também não garante que está tudo bem. Se você sente que algo mudou, se está sofrendo ou se as pessoas próximas estão preocupadas, vale procurar ajuda, qualquer que seja o número.',
          ],
        },
        {
          heading: 'E outros questionários?',
          paragraphs: [
            'Existem questionários de triagem para outros quadros, como o transtorno bipolar. Mesmo assim, o NICE orienta a não usar questionários na atenção primária para identificar transtorno bipolar em adultos: o caminho é perguntar sobre a história de humor e encaminhar para avaliação especializada quando houver sinais. No app, só usamos instrumentos validados cuja licença e tradução oficial permitem o uso, e sempre como triagem.',
          ],
        },
        {
          heading: 'Como usar bem seus resultados',
          paragraphs: [
            'Responda a cada duas semanas, pensando em como as coisas foram de verdade. Observe a tendência ao longo do tempo, mais do que um número isolado. Leve os resultados e seus registros para a conversa com o profissional que acompanha você; eles ajudam a contar sua história.',
          ],
        },
      ],
    },
    'pt-PT': {
      title: 'Rastreio não é diagnóstico',
      summary:
        'O PHQ-9 e o GAD-7 mostram a intensidade de sinais de depressão e de ansiedade. Ajudam a acompanhar e a decidir quando procurar ajuda, mas não dizem o que tem.',
      sections: [
        {
          heading: 'O que os questionários medem',
          paragraphs: [
            'O PHQ-9 tem nove perguntas sobre sinais de depressão nos últimos 14 dias, como pouco interesse, desânimo, sono e cansaço. Cada resposta vale de 0 a 3, e o total vai de 0 a 27. O GAD-7 faz o mesmo com sete sinais de ansiedade, com um total de 0 a 21.',
            'Os intervalos de pontuação vêm dos estudos que criaram os questionários. No PHQ-9, 5, 10, 15 e 20 marcam o início dos níveis ligeiro, moderado, moderadamente grave e grave. No GAD-7, 5, 10 e 15 marcam os níveis ligeiro, moderado e grave, e o manual dos autores recomenda uma avaliação mais completa a partir de 10.',
          ],
        },
        {
          heading: 'Porque é que não é diagnóstico',
          paragraphs: [
            'O diagnóstico é uma conclusão clínica. Tem em conta a sua história, há quanto tempo os sinais existem, o quanto prejudicam a vida, outras condições de saúde que possam explicar o que sente e o que mais está a acontecer. Um questionário não vê nada disso.',
            'No estudo original do PHQ-9, a pontuação de 10 ou mais identificou corretamente 88% das pessoas com depressão major confirmada por entrevista com um profissional, e 88% das pessoas sem ela. Uma análise de 2019, com dados de mais de dezassete mil participantes, encontrou números parecidos. São bons resultados para um rastreio, mas deixam margem para erros nos dois sentidos.',
            'Outra análise, de 2020, mostrou o tamanho dessa margem: entre mais de nove mil pessoas, 24,6% tiveram um PHQ-9 de 10 ou mais, mas só 12,1% cumpriam os critérios de depressão major numa entrevista diagnóstica com um profissional. Ou seja, a pontuação sozinha tende a apontar mais casos do que os que existem de facto.',
          ],
        },
        {
          heading: 'O que significa um resultado alto',
          paragraphs: [
            'Um resultado alto é um sinal para falar com um profissional, não uma sentença. O grupo de trabalho de prevenção dos Estados Unidos, que recomenda o rastreio da depressão em adultos, deixa claro que todos os resultados positivos precisam de uma avaliação adicional para confirmar o diagnóstico e perceber a gravidade.',
            'O mesmo se aplica ao item 9 do PHQ-9, sobre pensamentos de morte ou de se magoar. Qualquer resposta acima de zero merece atenção, e o manual dos autores lembra que avaliar o risco a sério exige uma conversa clínica. Por isso a app mostra contactos de ajuda sempre que isso acontece.',
          ],
        },
        {
          heading: 'O que significa um resultado baixo',
          paragraphs: [
            'Um resultado baixo também não garante que está tudo bem. Se sente que algo mudou, se está em sofrimento ou se as pessoas próximas estão preocupadas, vale a pena procurar ajuda, seja qual for o número.',
          ],
        },
        {
          heading: 'E outros questionários?',
          paragraphs: [
            'Existem questionários de rastreio para outros quadros, como a perturbação bipolar. Ainda assim, o NICE recomenda não usar questionários nos cuidados de saúde primários para identificar a perturbação bipolar em adultos: o caminho é perguntar pela história do humor e encaminhar para avaliação especializada quando houver sinais. Na app, só usamos instrumentos validados cuja licença e tradução oficial permitem o uso, e sempre como rastreio.',
          ],
        },
        {
          heading: 'Como usar bem os seus resultados',
          paragraphs: [
            'Responda de duas em duas semanas, a pensar em como as coisas correram de verdade. Observe a tendência ao longo do tempo, mais do que um número isolado. Leve os resultados e os seus registos para a conversa com o profissional que o/a acompanha; ajudam a contar a sua história.',
          ],
        },
      ],
    },
    en: {
      title: 'Screening is not diagnosis',
      summary:
        'The PHQ-9 and GAD-7 show how intense signs of depression and anxiety have been. They help you keep track and decide when to seek help, but they do not tell you what you have.',
      sections: [
        {
          heading: 'What the questionnaires measure',
          paragraphs: [
            'The PHQ-9 asks nine questions about signs of depression over the last two weeks, such as little interest, feeling down, sleep and tiredness. Each answer scores from 0 to 3, and the total runs from 0 to 27. The GAD-7 does the same with seven signs of anxiety, for a total from 0 to 21.',
            'The score ranges come from the studies that created the questionnaires. On the PHQ-9, 5, 10, 15 and 20 mark the start of the mild, moderate, moderately severe and severe ranges. On the GAD-7, 5, 10 and 15 mark mild, moderate and severe, and the authors’ manual recommends further evaluation from 10 upwards.',
          ],
        },
        {
          heading: 'Why it is not a diagnosis',
          paragraphs: [
            'A diagnosis is a clinical conclusion. It takes into account your history, how long the signs have been there, how much they affect your life, other health conditions that could explain what you feel and whatever else is going on. A questionnaire sees none of that.',
            'In the original PHQ-9 study, a score of 10 or more correctly picked out 88% of people with major depression confirmed by a professional interview, and 88% of people without it. A 2019 analysis using data from more than seventeen thousand participants found similar figures. These are good results for screening, but they leave room for errors in both directions.',
            'Another analysis, from 2020, showed how much room: among more than nine thousand people, 24.6% scored 10 or more on the PHQ-9, but only 12.1% met the criteria for major depression in a diagnostic interview with a professional. In other words, the score alone tends to point to more cases than really exist.',
          ],
        },
        {
          heading: 'What a high score means',
          paragraphs: [
            'A high score is a signal to talk to a professional, not a verdict. The US Preventive Services Task Force, which recommends depression screening for adults, is clear that every positive screen needs further assessment to confirm the diagnosis and understand its severity.',
            'The same goes for item 9 of the PHQ-9, about thoughts of death or of hurting yourself. Any answer above zero deserves attention, and the authors’ manual notes that properly assessing risk requires a clinical conversation. That is why the app shows help contacts whenever it happens.',
          ],
        },
        {
          heading: 'What a low score means',
          paragraphs: [
            'A low score does not guarantee that all is well either. If you feel something has changed, if you are struggling or if people close to you are worried, it is worth seeking help, whatever the number.',
          ],
        },
        {
          heading: 'What about other questionnaires?',
          paragraphs: [
            'Screening questionnaires exist for other conditions, such as bipolar disorder. Even so, NICE advises against using questionnaires in primary care to identify bipolar disorder in adults: the way forward is to ask about a person’s history of mood and refer them for a specialist assessment when there are signs. In the app we only use validated instruments whose licence and official translation allow it, and always as screening.',
          ],
        },
        {
          heading: 'Using your results well',
          paragraphs: [
            'Answer every two weeks, thinking about how things have really been. Look at the trend over time more than at any single number. Take your results and your check-ins to the conversation with the professional who sees you; they help tell your story.',
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
