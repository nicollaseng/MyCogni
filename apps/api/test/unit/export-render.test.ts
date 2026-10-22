import { describe, expect, it } from '@jest/globals'
import { exportCopies } from '../../src/modules/exports/export-copy.ts'
import type { ExportData, ExportPage } from '../../src/modules/exports/export-collector.ts'
import {
  archivePlan,
  checkInsCsv,
  conversationMarkdown,
  memoriesCsv,
  pageHtml,
} from '../../src/modules/exports/export-render.ts'

const copy = exportCopies['pt-BR']

const zone = 'America/Sao_Paulo'

const day = new Date('2026-10-22T15:00:00Z')

function page(overrides: Partial<ExportPage> = {}): ExportPage {
  return {
    id: 'page-1',
    title: 'Um dia <bom>',
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Manhã' }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '<script>alert(1)</script> ' },
            { type: 'text', text: 'forte', marks: [{ type: 'bold' }, { type: 'link' }] },
            { type: 'hardBreak' },
          ],
        },
        { type: 'image', attrs: { path: 'u/p/a.webp' } },
        { type: 'image', attrs: { path: 'u/p/unknown.webp' } },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [{ type: 'text', text: 'feito' }],
            },
          ],
        },
        { type: 'mystery', content: [{ type: 'text', text: 'resto' }] },
        { type: 'horizontalRule' },
      ],
    },
    plainText: 'Manhã',
    imagePaths: ['u/p/a.webp'],
    createdAt: day,
    updatedAt: day,
    ...overrides,
  }
}

function data(overrides: Partial<ExportData> = {}): ExportData {
  return {
    account: { id: 'u', email: 'marina@exemplo.com', createdAt: day },
    profile: {
      accountType: 'patient',
      displayName: 'Marina',
      avatarPath: 'u/avatar.JPG',
      timezone: zone,
      locale: 'pt-BR',
    },
    consents: [],
    checkIns: [],
    assessments: [],
    pages: [page(), page({ id: 'page-2', imagePaths: ['u/p/b.png', 'u/p/c'] })],
    shares: [],
    careLinks: [],
    invitations: [],
    insights: [],
    memories: [],
    conversations: [
      {
        id: 'c1',
        journalEntryId: null,
        createdAt: day,
        updatedAt: day,
        messages: [
          { role: 'user', content: 'Quero falar sobre o trabalho hoje', createdAt: day },
          { role: 'assistant', content: 'Claro, me conta.', createdAt: day },
        ],
      },
      { id: 'c2', journalEntryId: null, createdAt: day, updatedAt: day, messages: [] },
    ],
    zen: [],
    zenSessions: [],
    reminders: { settings: null, devices: [] },
    support: [],
    notifications: [],
    professional: null,
    documents: [
      {
        path: 'u/doc.pdf',
        fileName: '../../crp.pdf',
        contentType: 'application/pdf',
        sizeBytes: 10,
        createdAt: day,
      },
    ],
    ...overrides,
  }
}

describe('archive plan', () => {
  it('names every file by date and title, without repeats or paths', () => {
    const plan = archivePlan(data(), copy)

    expect(plan.pages.map((entry) => entry.file)).toEqual([
      'mybook/2026-10-22-um-dia-bom.html',
      'mybook/2026-10-22-um-dia-bom-2.html',
    ])
    expect(plan.photos).toEqual([
      { path: 'u/p/a.webp', page: 'page-1', file: 'fotos/2026-10-22-um-dia-bom-1.webp' },
      { path: 'u/p/b.png', page: 'page-2', file: 'fotos/2026-10-22-um-dia-bom-2-1.png' },
      { path: 'u/p/c', page: 'page-2', file: 'fotos/2026-10-22-um-dia-bom-2-2' },
    ])
    expect(plan.conversations.map((entry) => entry.file)).toEqual([
      'conversas/2026-10-22-quero-falar-sobre-o-trabalho-hoje.md',
      'conversas/2026-10-22-conversa.md',
    ])
    expect(plan.avatar).toEqual({ path: 'u/avatar.JPG', file: 'perfil/foto.jpg' })
    expect(plan.documents).toEqual([{ path: 'u/doc.pdf', file: 'documentos/..-..-crp.pdf' }])
  })

  it('uses the first words of an untitled page and skips a missing photo', () => {
    const plan = archivePlan(
      data({
        profile: { ...data().profile, avatarPath: null },
        pages: [page({ title: null, plainText: 'Hoje acordei cedo e fui caminhar no parque' })],
      }),
      copy,
    )

    expect(plan.pages[0]?.file).toBe('mybook/2026-10-22-hoje-acordei-cedo-e-fui-caminhar.html')
    expect(plan.avatar).toBeNull()
  })
})

describe('page html', () => {
  it('escapes everything the person wrote and points photos to the archive', () => {
    const html = pageHtml(page(), new Map([['u/p/a.webp', 'fotos/a.webp']]), copy, 'pt-BR', zone)

    expect(html).toContain('<title>Um dia &lt;bom&gt;</title>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).toContain('<strong>forte</strong><br>')
    expect(html).toContain('<h2>Manhã</h2>')
    expect(html).toContain('<img src="../fotos/a.webp" alt="Foto">')
    expect(html).not.toContain('unknown.webp')
    expect(html).toContain('<li>☑ feito</li>')
    expect(html).toContain('resto')
    expect(html).toContain('<hr>')
    expect(html).toContain("default-src 'none'")
  })

  it('falls back to the plain text when the document cannot be read', () => {
    const html = pageHtml(
      page({ title: null, body: { nope: true }, plainText: 'linha 1\n<b>linha 2</b>' }),
      new Map(),
      copy,
      'pt-BR',
      zone,
    )

    expect(html).toContain('<title>2026-10-22</title>')
    expect(html).toContain('<p>linha 1</p><p>&lt;b&gt;linha 2&lt;/b&gt;</p>')
  })
})

describe('readable copies', () => {
  it('writes the check-ins as a spreadsheet without running formulas', () => {
    const csv = checkInsCsv(
      [
        {
          id: 'x',
          moodLevel: 4,
          emotions: ['calm', 'joy'],
          contexts: ['work'],
          note: '=1+1, "ótimo"',
          recordedAt: day,
          addenda: [{ id: 'a', text: 'depois', createdAt: day }],
        },
      ],
      copy,
      zone,
    )

    expect(csv).toContain('data,humor (0 a 6),emoções,contextos,nota,complementos')
    expect(csv).toContain('2026-10-22 12:00,4,calm; joy,work,"\'=1+1, ""ótimo""",depois')
  })

  it('writes the memories with their sources', () => {
    const csv = memoriesCsv(
      [
        {
          id: 'm',
          content: 'Caminhar ajuda.',
          kind: 'coping',
          origin: 'extracted',
          importance: 2,
          status: 'active',
          createdAt: day,
          updatedAt: day,
          sources: [{ kind: 'check_in', at: day }],
        },
      ],
      exportCopies['en-US'],
      zone,
    )

    expect(csv).toContain('memory,kind,origin,status,created at,sources')
    expect(csv).toContain('Caminhar ajuda.,coping,extracted,active,2026-10-22,check_in 2026-10-22')
  })

  it('writes a conversation as Markdown that cannot carry markup', () => {
    const [conversation] = data().conversations
    const markdown = conversationMarkdown(
      {
        id: 'c',
        journalEntryId: null,
        createdAt: day,
        updatedAt: day,
        messages: [
          ...(conversation?.messages ?? []),
          { role: 'notice', content: '<img src=x onerror=alert(1)>', createdAt: day },
        ],
      },
      copy,
      zone,
    )

    expect(markdown).toContain('# Cogni · 2026-10-22')
    expect(markdown).toContain('**Você** · 2026-10-22\n\nQuero falar sobre o trabalho hoje')
    expect(markdown).toContain('**Cogni** · 2026-10-22')
    expect(markdown).toContain('**Aviso** · 2026-10-22\n\n\\<img src=x onerror=alert(1)\\>')
  })

  it('explains each file in the person language', () => {
    expect(exportCopies['pt-BR'].readme('2026-10-22')).toContain('Preparado em 2026-10-22.')
    expect(exportCopies['pt-BR'].readme('2026-10-22')).toContain('planilha')
    expect(exportCopies['pt-PT'].readme('2026-10-22')).toContain('folha de cálculo')
    expect(exportCopies['en-GB'].readme('2026-10-22')).toContain('Prepared on 2026-10-22.')
  })
})
