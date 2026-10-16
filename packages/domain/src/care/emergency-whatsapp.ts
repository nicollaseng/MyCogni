export const emergencyWhatsappPattern = /^\+[1-9][0-9]{7,14}$/

export const defaultCountryCode = '+55'

export const maxEmergencyContacts = 3

export function isEmergencyWhatsapp(value: string): boolean {
  return emergencyWhatsappPattern.test(value)
}

export interface EmergencyWhatsappParts {
  countryCode: string
  number: string
}

export function emergencyWhatsappOf(countryCode: string, number: string): string | null {
  const typed = number.trim().startsWith('+') ? number : `${countryCode}${number}`
  const value = `+${typed.replace(/\D/g, '')}`
  return isEmergencyWhatsapp(value) ? value : null
}

export function emergencyWhatsappParts(value: string | null): EmergencyWhatsappParts {
  if (value === null) {
    return { countryCode: defaultCountryCode, number: '' }
  }
  return value.startsWith(defaultCountryCode)
    ? { countryCode: defaultCountryCode, number: value.slice(defaultCountryCode.length) }
    : { countryCode: '', number: value }
}

export function whatsappHref(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}
