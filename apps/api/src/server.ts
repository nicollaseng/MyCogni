import {
  anthropicSender,
  createClaudeAssistantModel,
  type AssistantModel,
} from './ai/assistant-model.ts'
import { createElevenLabsTranscriber } from './ai/elevenlabs-transcriber.ts'
import { createScriptedAssistantModel } from './ai/scripted-assistant-model.ts'
import { createScriptedTranscriber } from './ai/scripted-transcriber.ts'
import type { Transcriber } from './ai/transcriber.ts'
import { buildApp } from './app.ts'
import { createSupabaseAccountAdmin } from './auth/account-admin.ts'
import { createSupabaseTokenVerifier } from './auth/token-verifier.ts'
import { loadConfig } from './config/env.ts'
import { connectDatabase } from './db/client.ts'
import { createJournalImageStore } from './storage/journal-images.ts'
import { createProfileFileStores } from './storage/profile-files.ts'
import { createDataExportStore } from './storage/data-exports.ts'
import { createSupportAttachmentStore } from './storage/support-attachments.ts'

const config = loadConfig(process.env)
const database = connectDatabase(config.databaseUrl)

function assistantModel(): AssistantModel | null {
  if (config.assistantModel === 'scripted') {
    return createScriptedAssistantModel()
  }
  return config.anthropicApiKey === null
    ? null
    : createClaudeAssistantModel(anthropicSender(config.anthropicApiKey))
}

function transcriber(): Transcriber | null {
  if (config.assistantModel === 'scripted') {
    return createScriptedTranscriber()
  }
  return config.elevenLabsApiKey === null
    ? null
    : createElevenLabsTranscriber({
        apiKey: config.elevenLabsApiKey,
        zeroRetention: config.zeroRetentionTranscription,
      })
}

const app = await buildApp({
  config,
  db: database.db,
  verifier: createSupabaseTokenVerifier(config.supabaseUrl),
  accountAdmin: createSupabaseAccountAdmin(config.supabaseUrl, config.supabaseSecretKey),
  journalImages: createJournalImageStore(config.supabaseUrl, config.supabaseSecretKey),
  profileFiles: createProfileFileStores(config.supabaseUrl, config.supabaseSecretKey),
  photoFetcher: fetch,
  supportAttachments: createSupportAttachmentStore(config.supabaseUrl, config.supabaseSecretKey),
  exportFiles: createDataExportStore(config.supabaseUrl, config.supabaseSecretKey),
  assistantModel: assistantModel(),
  transcriber: transcriber(),
})

app.addHook('onClose', () => database.close())

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  app.log.info({ signal }, 'Shutting down')
  await app.close()
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown(signal)
  })
}

await app.listen({ host: config.host, port: config.port })
