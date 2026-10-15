import { describe, expect, it } from '@jest/globals'
import { conversationRisk, messageRisk, normalizeText, riskForMode } from './crisis-detector.ts'

describe('normalizeText', () => {
  it('drops accents, case and apostrophes', () => {
    expect(normalizeText('NÃO aguento   MAIS, I can’t')).toBe('nao aguento   mais, i cant')
  })
})

describe('messageRisk in Brazilian Portuguese', () => {
  it.each([
    ['Eu quero morrer', 'suicide'],
    ['às vezes penso em me matar', 'suicide'],
    ['Tô pensando em me matar hoje', 'suicide'],
    ['não quero mais viver assim', 'suicide'],
    ['Voltei a me cortar essa semana', 'self_harm'],
    ['vou matar alguém se continuar assim', 'harm_others'],
    ['meu marido me agride quando bebe', 'abuse'],
  ])('flags “%s” as urgent (%s)', (text, signal) => {
    expect(messageRisk(text)).toEqual({
      level: 'urgent',
      signals: expect.arrayContaining([signal]),
    })
  })

  it('reads accents and capitals the same way', () => {
    expect(messageRisk('NÃO QUERO MAIS VIVER').level).toBe('urgent')
    expect(messageRisk('nao quero mais viver').level).toBe('urgent')
  })

  it.each([
    ['Não aguento mais esse trabalho', 'hopelessness'],
    ['ando muito triste', 'distress'],
    ['não consigo dormir há dias', 'health'],
    ['o que é depressão?', 'topic'],
  ])('asks for care on “%s” (%s)', (text, signal) => {
    expect(messageRisk(text)).toEqual({ level: 'watch', signals: [signal] })
  })
})

describe('messageRisk in European Portuguese', () => {
  it.each([
    ['Apetece-me morrer', 'suicide'],
    ['estou farta de viver', 'suicide'],
    ['Quero magoar-me outra vez', 'self_harm'],
    ['ele bate-me quando chega a casa', 'abuse'],
    ['vou fazer mal a alguém', 'harm_others'],
  ])('flags “%s” as urgent (%s)', (text, signal) => {
    expect(messageRisk(text)).toEqual({
      level: 'urgent',
      signals: expect.arrayContaining([signal]),
    })
  })

  it('asks for care when the person is feeling low', () => {
    expect(messageRisk('Hoje estou muito em baixo')).toEqual({
      level: 'watch',
      signals: ['distress'],
    })
  })
})

describe('messageRisk in English', () => {
  it.each([
    ['I want to kill myself', 'suicide'],
    ['honestly I’d be better off dead', 'suicide'],
    ['I don’t want to live anymore', 'suicide'],
    ['I’ve been cutting myself again', 'self_harm'],
    ['I could kill someone right now', 'harm_others'],
    ['my partner beats me', 'abuse'],
  ])('flags “%s” as urgent (%s)', (text, signal) => {
    expect(messageRisk(text)).toEqual({
      level: 'urgent',
      signals: expect.arrayContaining([signal]),
    })
  })

  it('asks for care on hopeless or worrying health phrases', () => {
    expect(messageRisk('I feel hopeless and I can’t sleep')).toEqual({
      level: 'watch',
      signals: ['hopelessness', 'health'],
    })
  })
})

describe('negations and false positives', () => {
  it.each([
    'Não quero morrer, só quero entender o que sinto',
    'eu nunca vou me matar',
    'I would never kill myself',
    'I’m not going to hurt myself, I promise. I don’t want to die',
  ])('keeps care, but no blocking, when the phrase is denied: “%s”', (text) => {
    expect(messageRisk(text)).toEqual({
      level: 'watch',
      signals: expect.arrayContaining(['negated_crisis']),
    })
  })

  it('still blocks when a denial and a real statement come in the same message', () => {
    expect(messageRisk('Não quero morrer. Mas quero morrer quando lembro disso').level).toBe(
      'urgent',
    )
  })

  it('does not take a negation from another clause', () => {
    expect(messageRisk('Não, quero morrer').level).toBe('urgent')
    expect(messageRisk('não aguento mais, quero morrer').level).toBe('urgent')
  })

  it.each([
    'Quase morri de rir com o filme, quero morrer de rir de novo',
    'vou matar a saudade da minha avó no domingo',
    'Hoje vou matar aula para descansar',
    'Esse trânsito está me matando',
    'I could kill for a coffee',
    'I want to die laughing at this show',
    'I hurt myself playing football',
    'Me cortei cozinhando ontem',
    'Dormi bem e saí para caminhar',
    'Estou bem, não estou deprimido',
  ])('ignores everyday expressions: “%s”', (text) => {
    expect(messageRisk(text).level).not.toBe('urgent')
  })

  it.each([
    'Quase morri de rir com o filme, quero morrer de rir de novo',
    'vou matar a saudade da minha avó no domingo',
    'I could kill for a coffee',
    'Dormi bem e saí para caminhar',
  ])('stays quiet on “%s”', (text) => {
    expect(messageRisk(text)).toEqual({ level: 'none', signals: [] })
  })

  it('stays quiet on an empty message', () => {
    expect(messageRisk('   ')).toEqual({ level: 'none', signals: [] })
  })
})

describe('conversationRisk', () => {
  it('uses the current message when nothing came before', () => {
    expect(
      conversationRisk({ message: 'quero me matar', earlier: [], screeningRisk: false }),
    ).toEqual({ level: 'urgent', signals: ['suicide'] })
  })

  it('keeps care for the rest of a conversation that had a crisis', () => {
    expect(
      conversationRisk({
        message: 'o que eu faço agora?',
        earlier: ['quero morrer', 'obrigado'],
        screeningRisk: false,
      }),
    ).toEqual({ level: 'watch', signals: ['earlier_crisis'] })
  })

  it('notices a pattern of distress across messages', () => {
    const earlier = ['ando muito triste', 'não consigo dormir', 'ok']
    expect(conversationRisk({ message: 'e agora?', earlier, screeningRisk: false })).toEqual({
      level: 'watch',
      signals: ['earlier_concern'],
    })
    expect(
      conversationRisk({ message: 'e agora?', earlier: earlier.slice(1), screeningRisk: false }),
    ).toEqual({ level: 'none', signals: [] })
  })

  it('asks for care after a recent PHQ-9 answer about self-harm', () => {
    expect(
      conversationRisk({ message: 'como foi a semana?', earlier: [], screeningRisk: true }),
    ).toEqual({ level: 'watch', signals: ['screening'] })
  })
})

describe('riskForMode', () => {
  it('never blocks a professional, who gets care instructions instead', () => {
    expect(riskForMode('urgent', 'professional')).toBe('watch')
    expect(riskForMode('urgent', 'personal')).toBe('urgent')
    expect(riskForMode('watch', 'professional')).toBe('watch')
  })
})
