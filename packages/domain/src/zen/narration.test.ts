import { describe, expect, it } from '@jest/globals'
import { articleIds, trackIds, tracks } from './catalog.ts'
import { articles } from './content/articles/articles.ts'
import {
  articleKey,
  articleNarration,
  articleNarrationItem,
  narrationItems,
  previewNarrationItem,
  spokenText,
  stepKey,
  stepNarration,
  stepNarrationItems,
} from './narration.ts'

describe('spokenText', () => {
  it('reads gendered slashes and breathing counts out loud', () => {
    expect(spokenText('Faça sentado/a, sem pressa.')).toBe('Faça sentado ou sentada, sem pressa.')
    expect(spokenText('o profissional que o/a acompanha')).toBe('o profissional que o acompanha')
    expect(spokenText('Respiração 4-4-4-4.')).toBe('Respiração 4, 4, 4, 4.')
    expect(spokenText('PHQ-9 e GAD-7')).toBe('PHQ-9 e GAD-7')
  })
})

describe('articleNarration', () => {
  it('reads the title, the lead and every section in order', () => {
    const text = articleNarration({
      title: 'Sono e humor',
      summary: 'Noites ruins pesam.',
      sections: [
        { paragraphs: ['Primeiro parágrafo.'] },
        { heading: 'O que ajuda', paragraphs: ['Segundo.', 'Terceiro.'] },
        { heading: 'Já tem ponto?', paragraphs: ['Quarto.'] },
      ],
    })
    expect(text).toBe(
      [
        'Sono e humor.',
        'Noites ruins pesam.',
        'Primeiro parágrafo.',
        'O que ajuda.',
        'Segundo.',
        'Terceiro.',
        'Já tem ponto?',
        'Quarto.',
      ].join('\n\n'),
    )
  })
})

describe('stepNarration', () => {
  it('reads the step title before its text', () => {
    expect(stepNarration({ title: 'Refletir', body: 'O que mudou?' })).toBe(
      'Refletir.\n\nO que mudou?',
    )
  })
})

describe('narration items', () => {
  it('keys articles and steps in a stable way', () => {
    expect(articleKey('worry-time')).toBe('article/worry-time')
    expect(stepKey('low-mood', 'reflect')).toBe('step/low-mood/reflect')
    expect(articleNarrationItem('worry-time', 'en')).toEqual({
      key: 'article/worry-time',
      title: articles['worry-time'].text.en.title,
      text: articleNarration(articles['worry-time'].text.en),
    })
  })

  it('covers the voice sample, every article and every step of every track', () => {
    for (const language of ['pt-BR', 'pt-PT', 'en'] as const) {
      const items = narrationItems(language)
      const steps = trackIds.reduce((total, id) => total + tracks[id].steps.length, 0)
      expect(items).toHaveLength(1 + articleIds.length + steps)
      expect(new Set(items.map((item) => item.key)).size).toBe(items.length)
      expect(items[0]).toEqual(previewNarrationItem(language))
      expect(items.every((item) => item.text.trim() !== '' && item.title !== '')).toBe(true)
    }
    expect(stepNarrationItems('seeking-help', 'pt-BR').map((item) => item.key)).toEqual(
      tracks['seeking-help'].steps.map((step) => stepKey('seeking-help', step.id)),
    )
  })

  it('writes a short voice sample in each language', () => {
    expect(previewNarrationItem('pt-BR').text).toContain('para você')
    expect(previewNarrationItem('pt-PT').text).toContain('para si')
    expect(previewNarrationItem('en').title).toBe('Voice sample')
  })
})
