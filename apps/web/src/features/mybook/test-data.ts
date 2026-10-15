import type { JournalEntrySummary, JournalNode, JournalShare } from '@mycogni/contracts'

export const timeZone = 'America/Sao_Paulo'

export const now = new Date('2026-10-15T15:00:00.000Z')

export function summaryOf(overrides: Partial<JournalEntrySummary> = {}): JournalEntrySummary {
  return {
    id: '8a7d3c1e-0000-4000-8000-000000000001',
    title: 'Um domingo mais leve',
    excerpt: 'Acordei cedo e fui caminhar no parque.',
    imageCount: 0,
    createdAt: '2026-10-15T12:00:00.000Z',
    updatedAt: '2026-10-15T12:00:00.000Z',
    ...overrides,
  }
}

export function shareOf(overrides: Partial<JournalShare> = {}): JournalShare {
  return {
    id: '5b1e2f3a-0000-4000-8000-000000000001',
    careLinkId: '3e2d1c0b-0000-4000-8000-000000000001',
    professional: { name: 'Helena Prado', kind: 'psychologist' },
    scope: 'entries',
    entryIds: ['8a7d3c1e-0000-4000-8000-000000000001'],
    expiresAt: '2026-10-22T15:00:00.000Z',
    revokedAt: null,
    active: true,
    createdAt: '2026-10-15T14:00:00.000Z',
    lastAccessAt: null,
    ...overrides,
  }
}

export const sampleDocument: JournalNode = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Manhã' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Caminhei ' },
        { type: 'text', text: 'sem pressa', marks: [{ type: 'bold' }] },
        { type: 'hardBreak' },
        { type: 'text', text: 'e voltei.' },
      ],
    },
    {
      type: 'image',
      attrs: { path: 'user/entry/one.png', src: 'https://storage.local/one.png?token=a' },
    },
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ligar' }] }],
        },
      ],
    },
    {
      type: 'dashList',
      content: [
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Dormir cedo' }] },
            { type: 'image', attrs: { path: 'user/entry/two.png', src: null } },
          ],
        },
      ],
    },
    { type: 'image', attrs: { path: 'user/entry/one.png' } },
    { type: 'paragraph' },
  ],
}
