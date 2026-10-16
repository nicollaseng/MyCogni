import type { CareLink } from '@mycogni/contracts'
import { maxEmergencyContacts } from '@mycogni/domain'

export interface LinkedProfessional {
  name: string
  emergencyWhatsapp: string | null
}

export interface EmergencyContact {
  name: string
  whatsapp: string
}

export function linkedProfessionalsOf(links: readonly CareLink[]): LinkedProfessional[] {
  return links.map(({ professional }) => ({
    name: professional.name,
    emergencyWhatsapp: professional.emergencyWhatsapp,
  }))
}

export function emergencyContactsOf(
  professionals: readonly LinkedProfessional[],
): EmergencyContact[] {
  return professionals
    .flatMap(({ name, emergencyWhatsapp }) =>
      emergencyWhatsapp === null ? [] : [{ name, whatsapp: emergencyWhatsapp }],
    )
    .slice(0, maxEmergencyContacts)
}
