import { linkedProfessionals } from '@/features/safety/prompt'
import { HelpDisclosure } from '@/shared/components/help-disclosure'

export async function FooterHelp() {
  return <HelpDisclosure professionals={await linkedProfessionals()} />
}
