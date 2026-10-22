import { createWriteStream } from 'node:fs'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { ReadableStream } from 'node:stream/web'
import { exportSchemaVersion, type Locale } from '@mycogni/domain'
import { ZipFile } from 'yazl'
import type { ExportCopy } from './export-copy.ts'
import type { ExportData } from './export-collector.ts'
import {
  archivePlan,
  checkInsCsv,
  conversationMarkdown,
  memoriesCsv,
  pageHtml,
  photoCaptions,
  type ArchivePlan,
} from './export-render.ts'

export type ArchiveSource = 'journal' | 'avatar' | 'documents'

export interface ArchiveFiles {
  open(source: ArchiveSource, path: string): Promise<ReadableStream<Uint8Array>>
}

export interface ArchiveInput {
  data: ExportData
  copy: ExportCopy
  locale: Locale
  exportedAt: Date
  files: ArchiveFiles
}

export interface Archive {
  file: string
  size: number
  dispose(): Promise<void>
}

function dataDocument(
  { data, locale, exportedAt }: ArchiveInput,
  plan: ArchivePlan,
): Record<string, unknown> {
  const { documents, professional, careLinks, invitations, ...rest } = data
  return {
    schemaVersion: exportSchemaVersion,
    exportedAt,
    locale,
    files: { readme: 'LEIA-ME.txt', checkIns: 'registros.csv', memories: 'memorias.csv' },
    account: rest.account,
    profile: { ...rest.profile, photo: plan.avatar?.file ?? null },
    consents: rest.consents,
    checkIns: rest.checkIns,
    assessments: rest.assessments,
    questionnaires: rest.questionnaires,
    mybook: {
      pages: plan.pages.map(({ page, file }) => {
        const captions = photoCaptions(page.body)
        return {
          ...page,
          file,
          photos: plan.photos
            .filter((photo) => photo.page === page.id)
            .map(({ path, file: photo }) => ({
              path,
              file: photo,
              caption: captions.get(path) ?? '',
            })),
        }
      }),
      shares: rest.shares,
    },
    care: { links: careLinks, invitations },
    insights: rest.insights,
    memories: rest.memories,
    conversations: plan.conversations.map(({ conversation, file }) => ({ ...conversation, file })),
    zen: { steps: rest.zen, sessions: rest.zenSessions },
    reminders: rest.reminders,
    support: rest.support,
    notifications: rest.notifications,
    professional:
      professional === null
        ? null
        : {
            ...professional,
            documents: documents.map(({ path, ...document }) => ({
              ...document,
              file: plan.documents.find((entry) => entry.path === path)?.file ?? null,
            })),
          },
  }
}

async function download(
  files: ArchiveFiles,
  source: ArchiveSource,
  path: string,
  target: string,
): Promise<boolean> {
  try {
    await pipeline(Readable.fromWeb(await files.open(source, path)), createWriteStream(target))
    return true
  } catch {
    return false
  }
}

export async function writeArchive(input: ArchiveInput): Promise<Archive> {
  const folder = await mkdtemp(join(tmpdir(), 'mycogni-export-'))
  const dispose = () => rm(folder, { recursive: true, force: true })
  try {
    const { data, copy, locale, exportedAt, files } = input
    const zone = data.profile.timezone
    const plan = archivePlan(data, copy)
    const zip = new ZipFile()
    const target = join(folder, 'export.zip')
    const written = pipeline(zip.outputStream, createWriteStream(target))
    const text = (content: string, name: string) => {
      zip.addBuffer(Buffer.from(content, 'utf8'), name)
    }
    text(copy.readme(exportedAt.toISOString().slice(0, 10)), 'LEIA-ME.txt')
    text(JSON.stringify(dataDocument(input, plan), null, 2), 'dados.json')
    text(checkInsCsv(data.checkIns, copy, zone), 'registros.csv')
    text(memoriesCsv(data.memories, copy, zone), 'memorias.csv')
    const photoNames = new Map(plan.photos.map((photo) => [photo.path, photo.file]))
    for (const { page, file } of plan.pages) {
      text(pageHtml(page, photoNames, copy, locale, zone), file)
    }
    for (const { conversation, file } of plan.conversations) {
      text(conversationMarkdown(conversation, copy, zone), file)
    }
    const attachments: { source: ArchiveSource; path: string; file: string }[] = [
      ...plan.photos.map((photo) => ({ source: 'journal' as const, ...photo })),
      ...(plan.avatar === null ? [] : [{ source: 'avatar' as const, ...plan.avatar }]),
      ...plan.documents.map((document) => ({ source: 'documents' as const, ...document })),
    ]
    for (const [index, attachment] of attachments.entries()) {
      const local = join(folder, `file-${String(index)}`)
      if (await download(files, attachment.source, attachment.path, local)) {
        zip.addFile(local, attachment.file)
      }
    }
    zip.end()
    await written
    return { file: target, size: (await stat(target)).size, dispose }
  } catch (error) {
    await dispose()
    throw error
  }
}
