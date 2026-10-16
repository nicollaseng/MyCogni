import type { RiskLevel } from '@mycogni/domain'
import { fetchCareLinks } from '@/shared/lib/api/care'
import { linkedProfessionalsOf, type LinkedProfessional } from '@/shared/lib/emergency-contacts'
import type { SafetyPrompt } from './model'

export async function linkedProfessionals(): Promise<LinkedProfessional[]> {
  try {
    return linkedProfessionalsOf(await fetchCareLinks())
  } catch (cause) {
    console.error(cause)
    return []
  }
}

export async function safetyPromptFor(level: RiskLevel): Promise<SafetyPrompt | null> {
  return level === 'urgent' ? { professionals: await linkedProfessionals() } : null
}
