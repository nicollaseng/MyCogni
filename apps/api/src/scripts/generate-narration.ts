import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { contentLanguages, isNarrationVoiceId, type ContentLanguage } from '@mycogni/domain'
import { z } from 'zod'
import { createElevenLabsProvider } from '../narration/elevenlabs.ts'
import {
  charactersOf,
  narrationContents,
  planNarration,
  renderNarration,
  type NarrationContent,
  type VoiceSelection,
} from '../narration/generate.ts'
import { createNarrationStore } from '../narration/narration-store.ts'

const keyFile =
  process.env.ELEVENLABS_API_KEY_FILE ?? join(homedir(), '.config', 'mycogni', 'elevenlabs-api-key')

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    languages: { type: 'string', default: contentLanguages.join(',') },
    voices: { type: 'string', default: 'default' },
    content: { type: 'string', default: 'all' },
  },
})

function contentOf(value: string): NarrationContent {
  const content = narrationContents.find((candidate) => candidate === value.trim())
  if (content === undefined) {
    throw new Error(`Unknown content "${value}". Use ${narrationContents.join(', ')}.`)
  }
  return content
}

function languagesOf(list: string): ContentLanguage[] {
  return list.split(',').map((value) => {
    const language = contentLanguages.find((candidate) => candidate === value.trim())
    if (language === undefined) {
      throw new Error(`Unknown language "${value}". Use ${contentLanguages.join(', ')}.`)
    }
    return language
  })
}

function selectionOf(value: string): VoiceSelection {
  if (value === 'default' || value === 'all') {
    return value
  }
  return value.split(',').map((voice) => {
    const id = voice.trim()
    if (!isNarrationVoiceId(id)) {
      throw new Error(`Unknown voice "${voice}".`)
    }
    return id
  })
}

async function readKey(): Promise<string | null> {
  try {
    const key = (await readFile(keyFile, 'utf8')).trim()
    return key === '' ? null : key
  } catch {
    return null
  }
}

const languages = languagesOf(values.languages)
const selection = selectionOf(values.voices)
const content = contentOf(values.content)
const dryRun = values['dry-run']
const apiKey = dryRun ? null : await readKey()

if (!dryRun && apiKey === null) {
  console.error(
    `No ElevenLabs key at ${keyFile}. Save the key there (one line, not committed) and run again. Nothing was generated.`,
  )
  process.exit(1)
}

const env = z
  .object({
    SUPABASE_URL: z.url().transform((value) => value.replace(/\/+$/, '')),
    SUPABASE_SECRET_KEY: z.string().min(1),
  })
  .parse(process.env)

const store = createNarrationStore({
  supabaseUrl: env.SUPABASE_URL,
  secretKey: env.SUPABASE_SECRET_KEY,
})
const manifest = await store.readManifest()
const jobs = planNarration(manifest, languages, selection, content)

console.info(
  `${String(jobs.length)} narrations to render (${String(charactersOf(jobs))} characters), ${String(Object.keys(manifest.files).length)} already stored.`,
)

if (dryRun || apiKey === null) {
  for (const job of jobs) {
    console.info(`${job.path} ${String(job.item.text.length)}`)
  }
  process.exit(0)
}

await renderNarration({
  jobs,
  manifest,
  provider: createElevenLabsProvider({ apiKey }),
  store,
  report: (message) => {
    console.info(message)
  },
})
console.info('Narration manifest updated')
