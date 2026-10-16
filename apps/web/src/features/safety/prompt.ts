import type { RiskLevel } from '@mycogni/domain'
import { fetchCareLinks } from '@/shared/lib/api/care'
import type { SafetyPrompt } from './model'

async function linkedProfessionals(): Promise<string[]> {
  try {
    return (await fetchCareLinks()).map((link) => link.professional.name)
  } catch (cause) {
    console.error(cause)
    return []
  }
}

export async function safetyPromptFor(level: RiskLevel): Promise<SafetyPrompt | null> {
  return level === 'urgent' ? { professionals: await linkedProfessionals() } : null
}
